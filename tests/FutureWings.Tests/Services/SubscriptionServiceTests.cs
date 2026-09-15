using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using FutureWings.Infrastructure.Services;
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

        var service = new SubscriptionService(context, config);
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

        var service = new SubscriptionService(context, config);
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

        var service = new SubscriptionService(context, config);
        var session = await service.CreateCheckoutSessionAsync(1, "Pro", "http://localhost:5173");

        Assert.NotNull(session);
        Assert.StartsWith("cs_test_demo_", session.SessionId);
        Assert.Contains("checkout=success", session.CheckoutUrl);
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

        var service = new SubscriptionService(context, config);

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
}
