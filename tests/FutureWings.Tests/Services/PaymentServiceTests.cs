using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class PaymentServiceTests
{
    [Fact]
    public async Task CreateSubscriptionAsync_ReturnsDemoSubscriptionId()
    {
        var service = new PaymentService();

        var subscriptionId = await service.CreateSubscriptionAsync(1, "price_pro");

        Assert.NotNull(subscriptionId);
        Assert.StartsWith("sub_demo_", subscriptionId);
    }

    [Fact]
    public async Task CreateSubscriptionAsync_ReturnsUniqueIdsPerCall()
    {
        var service = new PaymentService();

        var id1 = await service.CreateSubscriptionAsync(1, "price_pro");
        var id2 = await service.CreateSubscriptionAsync(1, "price_pro");

        Assert.NotEqual(id1, id2);
    }
}
