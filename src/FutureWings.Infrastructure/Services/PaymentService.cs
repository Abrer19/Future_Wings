using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// Demo Stripe payment service implementation for demo and local development.
/// </summary>
public class PaymentService : IPaymentService
{
    public Task<string> CreateSubscriptionAsync(int userId, string priceId) =>
        Task.FromResult($"sub_demo_{Guid.NewGuid():N}");
}
