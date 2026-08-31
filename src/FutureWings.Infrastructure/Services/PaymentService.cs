using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Returns a fake subscription id; StripePaymentService is never called.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IPaymentService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
public class PaymentService : IPaymentService
{
    public Task<string> CreateSubscriptionAsync(int userId, string priceId) =>
        Task.FromResult($"sub_placeholder_{Guid.NewGuid():N}");
}
