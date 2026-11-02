using FutureWings.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Tests.Services;

public class PaymentServiceTests
{
    private static IConfiguration CreateConfig(string environment, bool demoMode)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ASPNETCORE_ENVIRONMENT"] = environment,
            ["DemoMode:Enabled"] = demoMode ? "true" : "false"
        };
        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }

    [Fact]
    public async Task CreateSubscriptionAsync_InDemoMode_ReturnsDemoSubscriptionId()
    {
        var config = CreateConfig("Development", demoMode: true);
        var service = new PaymentService(config);

        var subscriptionId = await service.CreateSubscriptionAsync(1, "price_pro");

        Assert.NotNull(subscriptionId);
        Assert.StartsWith("sub_demo_", subscriptionId);
    }

    [Fact]
    public async Task CreateSubscriptionAsync_InDemoMode_ReturnsUniqueIdsPerCall()
    {
        var config = CreateConfig("Development", demoMode: true);
        var service = new PaymentService(config);

        var id1 = await service.CreateSubscriptionAsync(1, "price_pro");
        var id2 = await service.CreateSubscriptionAsync(1, "price_pro");

        Assert.NotEqual(id1, id2);
    }

    [Fact]
    public async Task CreateSubscriptionAsync_InProduction_ThrowsInvalidOperationException()
    {
        // Even if DemoMode:Enabled is true, Production MUST reject simulated payment
        var config = CreateConfig("Production", demoMode: true);
        var service = new PaymentService(config);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateSubscriptionAsync(1, "price_pro"));

        Assert.Contains("unavailable", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateSubscriptionAsync_WhenDemoModeDisabled_ThrowsInvalidOperationException()
    {
        var config = CreateConfig("Development", demoMode: false);
        var service = new PaymentService(config);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateSubscriptionAsync(1, "price_pro"));

        Assert.Contains("unavailable", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateSubscriptionAsync_WithEmptyPriceId_ThrowsArgumentException(string? invalidPriceId)
    {
        var config = CreateConfig("Development", demoMode: true);
        var service = new PaymentService(config);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateSubscriptionAsync(1, invalidPriceId!));
    }
}
