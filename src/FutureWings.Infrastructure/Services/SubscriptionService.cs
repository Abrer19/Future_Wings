using FutureWings.Application.DTOs.Subscription;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// Subscription state plus real Stripe Checkout.
///
/// Configuration (user-secrets in Development, environment variables in Production):
///   Stripe:SecretKey        sk_test_... / sk_live_...
///   Stripe:WebhookSecret    whsec_...            (required to accept webhooks)
///   Stripe:Prices:Pro       price_...            (recurring price id)
///   Stripe:Prices:Premium   price_...
///
/// Nothing here has a hardcoded key, and no tier is ever granted without a verified
/// Stripe event — <see cref="ApplyWebhookAsync"/> is the only path that upgrades a user.
/// </summary>
public sealed class SubscriptionService(FutureWingsDbContext context, IConfiguration configuration)
    : ISubscriptionService
{
    private string? SecretKey => Get("Stripe:SecretKey");
    private string? WebhookSecret => Get("Stripe:WebhookSecret");

    /// Treats the committed "replace-with-..." placeholders as absent.
    private string? Get(string key)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value) || value.StartsWith("replace-with", StringComparison.OrdinalIgnoreCase)
            ? null
            : value;
    }

    private string? PriceIdFor(string tier) => Get($"Stripe:Prices:{tier}");

    public bool StripeConfigured => SecretKey is not null;

    public IReadOnlyList<SubscriptionPlanDto> GetPlans() =>
        SubscriptionPlans.All.Select(plan => new SubscriptionPlanDto
        {
            Tier = plan.Tier,
            Name = plan.Name,
            Description = plan.Description,
            MonthlyPriceUsd = plan.MonthlyPriceUsd,
            Highlights = plan.Highlights,
            Features = plan.Features,
            // A free plan is always "purchasable"; a paid one needs a configured price id.
            Purchasable = !SubscriptionPlans.IsPaid(plan.Tier) || (StripeConfigured && PriceIdFor(plan.Tier) is not null),
        }).ToList();

    public async Task<SubscriptionStatusDto> GetStatusAsync(int userId)
    {
        var user = await context.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == userId)
            .Select(candidate => new { candidate.SubscriptionTier, candidate.SubscriptionRenewsAt })
            .SingleOrDefaultAsync() ?? throw new KeyNotFoundException("User not found.");

        return new SubscriptionStatusDto
        {
            Tier = user.SubscriptionTier,
            Features = SubscriptionPlans.FeaturesFor(user.SubscriptionTier),
            RenewsAt = user.SubscriptionRenewsAt,
            StripeConfigured = StripeConfigured,
        };
    }

    public async Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int userId, string tier, string returnUrl)
    {
        if (!SubscriptionPlans.IsKnown(tier) || !SubscriptionPlans.IsPaid(tier))
        {
            throw new ArgumentException("Choose either the Pro or Premium plan.");
        }

        var secretKey = SecretKey
            ?? throw new InvalidOperationException(
                "Stripe is not configured. Set Stripe:SecretKey (user-secrets in development, Stripe__SecretKey in production).");

        var priceId = PriceIdFor(tier)
            ?? throw new InvalidOperationException($"No Stripe price id configured for the {tier} plan (Stripe:Prices:{tier}).");

        var user = await context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        StripeConfiguration.ApiKey = secretKey;

        // Reuse the Stripe customer across checkouts so a user does not accumulate duplicates.
        if (string.IsNullOrWhiteSpace(user.StripeCustomerId))
        {
            var customer = await new CustomerService().CreateAsync(new CustomerCreateOptions
            {
                Email = user.Email,
                Metadata = new Dictionary<string, string> { ["userId"] = user.Id.ToString() },
            });
            user.StripeCustomerId = customer.Id;
            await context.SaveChangesAsync();
        }

        var session = await new SessionService().CreateAsync(new SessionCreateOptions
        {
            Mode = "subscription",
            Customer = user.StripeCustomerId,
            LineItems = [new SessionLineItemOptions { Price = priceId, Quantity = 1 }],
            SuccessUrl = $"{returnUrl}?checkout=success",
            CancelUrl = $"{returnUrl}?checkout=cancelled",
            // Echoed back on the webhook so the event can be tied to a user and tier
            // without trusting anything the browser sends.
            ClientReferenceId = user.Id.ToString(),
            Metadata = new Dictionary<string, string> { ["userId"] = user.Id.ToString(), ["tier"] = tier },
        });

        return new CheckoutSessionDto { SessionId = session.Id, CheckoutUrl = session.Url };
    }

    public async Task<bool> ApplyWebhookAsync(string payload, string signatureHeader)
    {
        var webhookSecret = WebhookSecret
            ?? throw new InvalidOperationException("Stripe:WebhookSecret is not configured.");

        // Throws if the signature does not verify — an unsigned or forged body can never
        // reach the tier-granting code below.
        var stripeEvent = EventUtility.ConstructEvent(payload, signatureHeader, webhookSecret);

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
            {
                if (stripeEvent.Data.Object is not Session session) return false;
                var (userId, tier) = ReadMetadata(session.Metadata, session.ClientReferenceId);
                if (userId is null || tier is null) return false;

                var user = await context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId);
                if (user is null) return false;

                user.SubscriptionTier = tier;
                user.StripeSubscriptionId = session.SubscriptionId;
                user.SubscriptionRenewsAt = DateTimeOffset.UtcNow.AddMonths(1);

                context.Payments.Add(new Payment
                {
                    UserId = user.Id,
                    Amount = (session.AmountTotal ?? 0) / 100m,
                    Currency = session.Currency ?? "usd",
                    Status = "Succeeded",
                    Reference = session.Id,
                    CreatedAt = DateTimeOffset.UtcNow,
                });

                await context.SaveChangesAsync();
                return true;
            }

            case "customer.subscription.deleted":
            {
                if (stripeEvent.Data.Object is not Subscription subscription) return false;
                var user = await context.Users.SingleOrDefaultAsync(
                    candidate => candidate.StripeSubscriptionId == subscription.Id);
                if (user is null) return false;

                // Cancellation drops the account back to Free rather than deleting it.
                user.SubscriptionTier = SubscriptionPlans.Free;
                user.StripeSubscriptionId = null;
                user.SubscriptionRenewsAt = null;
                await context.SaveChangesAsync();
                return true;
            }

            default:
                return false;
        }
    }

    private static (int? UserId, string? Tier) ReadMetadata(IDictionary<string, string>? metadata, string? clientReferenceId)
    {
        var tier = metadata is not null && metadata.TryGetValue("tier", out var rawTier) ? rawTier : null;
        if (tier is null || !SubscriptionPlans.IsKnown(tier) || !SubscriptionPlans.IsPaid(tier)) return (null, null);

        var rawUserId = metadata is not null && metadata.TryGetValue("userId", out var value) ? value : clientReferenceId;
        return int.TryParse(rawUserId, out var userId) ? (userId, tier) : (null, null);
    }
}
