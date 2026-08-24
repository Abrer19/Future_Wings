using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class PaymentService : IPaymentService
{
    public Task<string> CreateSubscriptionAsync(int userId, string priceId) =>
        Task.FromResult($"sub_placeholder_{Guid.NewGuid():N}");
}
