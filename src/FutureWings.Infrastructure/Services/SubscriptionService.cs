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
/// Subscription state plus real Stripe Checkout and local demo simulation.
///
/// Configuration (user-secrets in Development, environment variables in Production):
///   Stripe:SecretKey        sk_test_... / sk_live_...
///   Stripe:WebhookSecret    whsec_...            (required to accept webhooks)
///   Stripe:Prices:Pro       price_...            (recurring price id)
///   Stripe:Prices:Premium   price_...
///
/// Nothing here has a hardcoded key, and no tier is ever granted without a verified
/// Stripe event — <see cref="ApplyWebhookAsync"/> is the only path that upgrades a user
/// in production. In development/demo mode, UnlockProDemoAsync grants Pro tier only.
/// </summary>
public sealed class SubscriptionService(
    FutureWingsDbContext context,
    IConfiguration configuration)
    : ISubscriptionService
{
    private string? SecretKey => Get("Stripe:SecretKey");
    private string? PublishableKey => Get("Stripe:PublishableKey");
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

    public bool IsDemoKey =>
        SecretKey is not null && (SecretKey.StartsWith("sk_test_demo", StringComparison.OrdinalIgnoreCase) || SecretKey.StartsWith("pk_test_demo", StringComparison.OrdinalIgnoreCase));

    public bool StripeConfigured => SecretKey is not null;

    private string CurrentEnvironment =>
        configuration["ASPNETCORE_ENVIRONMENT"] ??
        Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ??
        "Development";

    private bool IsProduction =>
        string.Equals(CurrentEnvironment, "Production", StringComparison.OrdinalIgnoreCase);

    private bool IsDemoModeConfigured =>
        (bool.TryParse(configuration["DemoMode:Enabled"], out var demoEnabled) && demoEnabled) ||
        string.Equals(configuration["FUTUREWINGS_DEMO_MODE"] ?? Environment.GetEnvironmentVariable("FUTUREWINGS_DEMO_MODE"), "true", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Fake checkout, for local development and demos.
    /// Strictly disabled in Production.
    /// Enabled when in demo key mode, when demo mode is enabled, or when explicitly allowed in configuration without real live keys.
    /// </summary>
    public bool SimulationEnabled =>
        !IsProduction &&
        (IsDemoKey
        || IsDemoModeConfigured
        || (!StripeConfigured
            && bool.TryParse(configuration["Stripe:AllowSimulatedCheckout"], out var allowed)
            && allowed));

    public IReadOnlyList<SubscriptionPlanDto> GetPlans() =>
        SubscriptionPlans.All.Select(plan => new SubscriptionPlanDto
        {
            Tier = plan.Tier,
            Name = plan.Name,
            Description = plan.Description,
            MonthlyPriceUsd = plan.MonthlyPriceUsd,
            Highlights = plan.Highlights,
            Features = plan.Features,
            // A free plan is always "purchasable"; a paid one needs a configured price id or simulation mode.
            Purchasable = !SubscriptionPlans.IsPaid(plan.Tier)
                || (StripeConfigured && PriceIdFor(plan.Tier) is not null)
                || SimulationEnabled,
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
            SimulationEnabled = SimulationEnabled,
            PublishableKey = PublishableKey ?? (IsDemoKey ? "pk_test_demo_51FutureWingsDemoPublishableKey889201" : null),
            IsDemoMode = !IsProduction && (IsDemoKey || SimulationEnabled || IsDemoModeConfigured),
        };
    }

    public async Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int userId, string tier, string returnUrl)
    {
        if (!SubscriptionPlans.IsKnown(tier) || !SubscriptionPlans.IsPaid(tier))
        {
            throw new ArgumentException("Choose either the Pro or Premium plan.");
        }

        ValidateReturnUrl(returnUrl);

        var secretKey = SecretKey;
        if (secretKey is null && !SimulationEnabled)
        {
            throw new InvalidOperationException(
                "Stripe is not configured. Set Stripe:SecretKey (user-secrets in development, Stripe__SecretKey in production).");
        }

        var user = await context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (IsDemoKey || (secretKey is null && SimulationEnabled))
        {
            // Generate demo checkout session
            if (string.IsNullOrWhiteSpace(user.StripeCustomerId))
            {
                user.StripeCustomerId = $"cus_demo_{Guid.NewGuid():N}";
                await context.SaveChangesAsync();
            }

            var demoSessionId = $"cs_test_demo_{Guid.NewGuid():N}";
            var separator = returnUrl.Contains('?') ? "&" : "?";
            return new CheckoutSessionDto
            {
                SessionId = demoSessionId,
                CheckoutUrl = $"{returnUrl}{separator}checkout=success&session_id={demoSessionId}&tier={tier}",
            };
        }

        var priceId = PriceIdFor(tier)
            ?? throw new InvalidOperationException($"No Stripe price id configured for the {tier} plan (Stripe:Prices:{tier}).");

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

        var successSeparator = returnUrl.Contains('?') ? "&" : "?";
        var cancelSeparator = returnUrl.Contains('?') ? "&" : "?";
        var session = await new SessionService().CreateAsync(new SessionCreateOptions
        {
            Mode = "subscription",
            Customer = user.StripeCustomerId,
            LineItems = [new SessionLineItemOptions { Price = priceId, Quantity = 1 }],
            SuccessUrl = $"{returnUrl}{successSeparator}checkout=success",
            CancelUrl = $"{returnUrl}{cancelSeparator}checkout=cancelled",
            // Echoed back on the webhook so the event can be tied to a user and tier
            // without trusting anything the browser sends.
            ClientReferenceId = user.Id.ToString(),
            Metadata = new Dictionary<string, string> { ["userId"] = user.Id.ToString(), ["tier"] = tier },
        });

        return new CheckoutSessionDto { SessionId = session.Id, CheckoutUrl = session.Url };
    }

    /// <summary>
    /// Demo-mode action to unlock Pro plan without real payment.
    /// Strictly refused in Production or when real Stripe live keys are configured.
    /// Grants exclusively the Pro tier and Roadmap entitlements (no Premium, no aiInterview).
    /// Fully idempotent: repeated calls do not create duplicate payments or conflicting entitlements.
    /// </summary>
    public async Task<SubscriptionStatusDto> UnlockProDemoAsync(int userId)
    {
        if (IsProduction || !SimulationEnabled || (StripeConfigured && !IsDemoKey))
        {
            throw new InvalidOperationException(
                "Simulated checkout is disabled. It is only available in development while demo mode is active and no real Stripe key is configured.");
        }

        var user = await context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        // If the user already has real Premium entitlement, preserve it without modifying or downgrading
        if (user.SubscriptionTier == SubscriptionPlans.Premium)
        {
            return await GetStatusAsync(userId);
        }

        // If user is not already Pro, upgrade to Pro
        if (user.SubscriptionTier != SubscriptionPlans.Pro)
        {
            user.SubscriptionTier = SubscriptionPlans.Pro;
            user.SubscriptionRenewsAt = DateTimeOffset.UtcNow.AddMonths(1);

            // Record simulated payment idempotently if not already present
            var hasPayment = await context.Payments.AnyAsync(p => p.UserId == user.Id && p.Status == "Simulated");
            if (!hasPayment)
            {
                var price = SubscriptionPlans.All.Single(plan => plan.Tier == SubscriptionPlans.Pro).MonthlyPriceUsd;
                context.Payments.Add(new Payment
                {
                    UserId = user.Id,
                    Amount = price,
                    Currency = "usd",
                    Status = "Simulated",
                    Reference = $"sim_demo_pro_{user.Id}",
                    CreatedAt = DateTimeOffset.UtcNow,
                });
            }

            await context.SaveChangesAsync();
        }

        return await GetStatusAsync(userId);
    }

    public async Task<SubscriptionStatusDto> SimulateUpgradeAsync(int userId, string tier)
    {
        if (string.Equals(tier, SubscriptionPlans.Pro, StringComparison.OrdinalIgnoreCase))
        {
            return await UnlockProDemoAsync(userId);
        }

        if (IsProduction || !SimulationEnabled || (StripeConfigured && !IsDemoKey))
        {
            throw new InvalidOperationException(
                "Simulated checkout is disabled. It is only available in development while demo mode is active and no real Stripe key is configured.");
        }

        if (string.Equals(tier, SubscriptionPlans.Premium, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Simulated upgrade to Premium is disabled. Premium requires a real subscription entitlement.");
        }

        // Unlike real checkout, Free is allowed here: it is how a tester drops back down
        // to demo the tiers again without editing the database by hand.
        if (!SubscriptionPlans.IsKnown(tier))
        {
            throw new ArgumentException("Choose the Free, Pro or Premium plan.");
        }

        var user = await context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.SubscriptionTier = tier;
        user.SubscriptionRenewsAt = null;

        await context.SaveChangesAsync();
        return await GetStatusAsync(userId);
    }

    public async Task<bool> ApplyWebhookAsync(string payload, string signatureHeader)
    {
        var webhookSecret = WebhookSecret
            ?? throw new InvalidOperationException("Stripe:WebhookSecret is not configured.");

        // Throws if the signature does not verify — an unsigned or forged body can never
        // reach the tier-granting code below.
        var stripeEvent = EventUtility.ConstructEvent(payload, signatureHeader, webhookSecret, throwOnApiVersionMismatch: false);

        // Webhook Idempotency Check
        if (!string.IsNullOrWhiteSpace(stripeEvent.Id) &&
            await context.ProcessedWebhookEvents.AnyAsync(e => e.StripeEventId == stripeEvent.Id))
        {
            return true;
        }

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
            {
                if (stripeEvent.Data.Object is not Session session) return false;

                // Idempotency: verify this checkout session has not already been credited
                if (!string.IsNullOrWhiteSpace(session.Id) &&
                    await context.Payments.AnyAsync(p => p.Reference == session.Id))
                {
                    await RecordProcessedEventAsync(stripeEvent.Id, stripeEvent.Type);
                    return true;
                }

                var (userId, tier) = ReadMetadata(session.Metadata, session.ClientReferenceId);
                if (userId is null || tier is null) return false;

                // Validate that subscription ID is present for subscription checkouts
                if (string.IsNullOrWhiteSpace(session.SubscriptionId)) return false;

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

                await RecordProcessedEventAsync(stripeEvent.Id, stripeEvent.Type);
                await context.SaveChangesAsync();
                return true;
            }

            case "customer.subscription.deleted":
            {
                if (stripeEvent.Data.Object is not Subscription subscription) return false;

                var user = await context.Users.SingleOrDefaultAsync(
                    candidate => candidate.StripeSubscriptionId == subscription.Id);
                if (user is null) return false;

                // Drop back to Free on cancellation rather than locking the user out entirely.
                user.SubscriptionTier = SubscriptionPlans.Free;
                user.StripeSubscriptionId = null;
                user.SubscriptionRenewsAt = null;

                await RecordProcessedEventAsync(stripeEvent.Id, stripeEvent.Type);
                await context.SaveChangesAsync();
                return true;
            }

            default:
                // Other event types are ignored without error.
                return false;
        }
    }

    private async Task RecordProcessedEventAsync(string eventId, string eventType)
    {
        if (string.IsNullOrWhiteSpace(eventId)) return;

        if (!await context.ProcessedWebhookEvents.AnyAsync(e => e.StripeEventId == eventId))
        {
            context.ProcessedWebhookEvents.Add(new ProcessedWebhookEvent
            {
                StripeEventId = eventId,
                EventType = eventType,
                ProcessedAt = DateTimeOffset.UtcNow
            });
        }
    }

    private void ValidateReturnUrl(string returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            throw new ArgumentException("Return URL is required.");
        }

        if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri))
        {
            throw new ArgumentException("Return URL must be a valid absolute URL.");
        }

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            throw new ArgumentException("Return URL must use http or https.");
        }

        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins")
            .GetChildren()
            .Select(c => c.Value)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v!)
            .ToArray();

        if (allowedOrigins.Length == 0)
        {
            allowedOrigins = configuration["CORS_ALLOWED_ORIGINS"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                ?? Array.Empty<string>();
        }

        var isAllowed = false;
        foreach (var allowed in allowedOrigins)
        {
            if (Uri.TryCreate(allowed, UriKind.Absolute, out var allowedUri) &&
                string.Equals(allowedUri.Host, uri.Host, StringComparison.OrdinalIgnoreCase) &&
                (allowedUri.Port == uri.Port || (allowedUri.IsDefaultPort && uri.IsDefaultPort)))
            {
                isAllowed = true;
                break;
            }
        }

        // Allow localhost and 127.0.0.1 in non-production environments
        if (!isAllowed && !IsProduction)
        {
            if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
            {
                isAllowed = true;
            }
        }

        if (!isAllowed)
        {
            throw new ArgumentException("Return URL host is not in the approved origins list.");
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
