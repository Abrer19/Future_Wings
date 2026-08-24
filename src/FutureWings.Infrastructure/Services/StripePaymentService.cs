namespace FutureWings.Infrastructure.Services;

public class StripePaymentService
{
    public Task<string> CreateSubscriptionAsync(string customerId, string priceId)
    {
        return Task.FromResult($"sub_placeholder_{Guid.NewGuid():N}");
    }
}
