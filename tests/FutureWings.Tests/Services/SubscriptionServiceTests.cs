using System.Security.Cryptography;
using System.Text;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using FWSubscriptionService = FutureWings.Infrastructure.Services.SubscriptionService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Tests.Services;

public class SubscriptionServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new FutureWingsDbContext(options);
        context.Users.Add(new User
        {
            Id = 1,
            Email = "demo@student.com",
            SubscriptionTier = "Free"
        });
        context.SaveChanges();
        return context;
    }

    private static IConfiguration CreateConfiguration(Dictionary<string, string?> inMemorySettings)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    private static string ComputeStripeSignature(string payload, string secret)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signedPayload = $"{timestamp}.{payload}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        var signature = Convert.ToHexString(hash).ToLowerInvariant();
        return $"t={timestamp},v1={signature}";
    }

    [Fact]
    public void GetPlans_ReturnsPlans_AllPurchasableInDemoMode()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:SecretKey"] = "sk_test_demo_51FutureWingsDemoSecretKey889201",
            ["Stripe:PublishableKey"] = "pk_test_demo_51FutureWingsDemoPublishableKey889201",
            ["Stripe:AllowSimulatedCheckout"] = "true"
        });

        var service = new FWSubscriptionService(context, config);
        var plans = service.GetPlans();

        Assert.NotEmpty(plans);
        Assert.Contains(plans, p => p.Tier == "Free");
        Assert.Contains(plans, p => p.Tier == "Pro" && p.Purchasable);
        Assert.Contains(plans, p => p.Tier == "Premium" && p.Purchasable);
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsDemoModeAndPublishableKey()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:SecretKey"] = "sk_test_demo_51FutureWingsDemoSecretKey889201",
            ["Stripe:PublishableKey"] = "pk_test_demo_51FutureWingsDemoPublishableKey889201",
            ["Stripe:AllowSimulatedCheckout"] = "true"
        });

        var service = new FWSubscriptionService(context, config);
        var status = await service.GetStatusAsync(1);

        Assert.Equal("Free", status.Tier);
        Assert.True(status.IsDemoMode);
        Assert.True(status.SimulationEnabled);
        Assert.Equal("pk_test_demo_51FutureWingsDemoPublishableKey889201", status.PublishableKey);
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_InDemoMode_GeneratesDemoSession()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:SecretKey"] = "sk_test_demo_51FutureWingsDemoSecretKey889201",
            ["Stripe:PublishableKey"] = "pk_test_demo_51FutureWingsDemoPublishableKey889201"
        });

        var service = new FWSubscriptionService(context, config);
        var session = await service.CreateCheckoutSessionAsync(1, "Pro", "http://localhost:5173");

        Assert.NotNull(session);
        Assert.StartsWith("cs_test_demo_", session.SessionId);
        Assert.Contains("checkout=success", session.CheckoutUrl);
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_InvalidReturnUrl_ThrowsArgumentException()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:SecretKey"] = "sk_test_demo_51FutureWingsDemoSecretKey889201",
            ["Stripe:PublishableKey"] = "pk_test_demo_51FutureWingsDemoPublishableKey889201"
        });

        var service = new FWSubscriptionService(context, config);

        // Reject arbitrary unapproved external origin
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateCheckoutSessionAsync(1, "Pro", "https://attacker-controlled-site.com/steal-token"));

        // Reject invalid URL scheme
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateCheckoutSessionAsync(1, "Pro", "javascript:alert(1)"));
    }

    [Fact]
    public async Task SimulateUpgradeAsync_InProduction_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["ASPNETCORE_ENVIRONMENT"] = "Production",
            ["Stripe:AllowSimulatedCheckout"] = "true"
        });

        var service = new FWSubscriptionService(context, config);

        // Simulation must be strictly rejected in Production
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SimulateUpgradeAsync(1, "Pro"));
    }

    [Fact]
    public async Task SimulateUpgradeAsync_WithRealStripeKey_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:SecretKey"] = "custom_production_key_mock_12345",
            ["Stripe:AllowSimulatedCheckout"] = "true"
        });

        var service = new FWSubscriptionService(context, config);

        // Simulation must be rejected when real live key is present
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SimulateUpgradeAsync(1, "Pro"));
    }

    [Fact]
    public async Task SimulateUpgradeAsync_UpgradesUserTierAndRecordsPayment()
    {
        using var context = CreateInMemoryDbContext();
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:AllowSimulatedCheckout"] = "true",
            ["Stripe:SecretKey"] = "sk_test_demo_51FutureWingsDemoSecretKey889201"
        });

        var service = new FWSubscriptionService(context, config);

        var upgradedStatus = await service.SimulateUpgradeAsync(1, "Pro");
        Assert.Equal("Pro", upgradedStatus.Tier);

        var userInDb = await context.Users.FindAsync(1);
        Assert.NotNull(userInDb);
        Assert.Equal("Pro", userInDb.SubscriptionTier);
        Assert.NotNull(userInDb.SubscriptionRenewsAt);

        var payments = await context.Payments.Where(p => p.UserId == 1).ToListAsync();
        Assert.Single(payments);
        Assert.Equal(9m, payments[0].Amount);
        Assert.Equal("Simulated", payments[0].Status);

        // Downgrade back to Free
        var downgradedStatus = await service.SimulateUpgradeAsync(1, "Free");
        Assert.Equal("Free", downgradedStatus.Tier);
    }

    [Fact]
    public async Task ApplyWebhookAsync_ReplayedEvent_IsIdempotentAndDoesNotDuplicatePayment()
    {
        using var context = CreateInMemoryDbContext();
        const string webhookSecret = "whsec_test_demo_secret_key_12345678";
        var config = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Stripe:WebhookSecret"] = webhookSecret
        });

        var service = new FWSubscriptionService(context, config);

        const string payload = "{\n  \"id\": \"evt_test_idempotent_123\",\n  \"object\": \"event\",\n  \"api_version\": \"2020-08-27\",\n  \"created\": 1600000000,\n  \"data\": {\n    \"object\": {\n      \"id\": \"cs_test_session_id_456\",\n      \"object\": \"checkout.session\",\n      \"client_reference_id\": \"1\",\n      \"subscription\": \"sub_test_subscription_789\",\n      \"amount_total\": 900,\n      \"currency\": \"usd\",\n      \"metadata\": {\n        \"userId\": \"1\",\n        \"tier\": \"Pro\"\n      }\n    }\n  },\n  \"type\": \"checkout.session.completed\"\n}";

        var signature = ComputeStripeSignature(payload, webhookSecret);

        // First execution
        var firstApplied = await service.ApplyWebhookAsync(payload, signature);
        Assert.True(firstApplied);

        var payments = await context.Payments.Where(p => p.UserId == 1).ToListAsync();
        Assert.Single(payments);
        Assert.Equal("cs_test_session_id_456", payments[0].Reference);

        var user = await context.Users.FindAsync(1);
        Assert.Equal("Pro", user!.SubscriptionTier);
        Assert.Equal("sub_test_subscription_789", user.StripeSubscriptionId);

        // Replay of the exact same event
        var secondApplied = await service.ApplyWebhookAsync(payload, signature);
        Assert.True(secondApplied);

        // Must still have exactly 1 payment record
        var paymentsAfterReplay = await context.Payments.Where(p => p.UserId == 1).ToListAsync();
        Assert.Single(paymentsAfterReplay);
    }
}
