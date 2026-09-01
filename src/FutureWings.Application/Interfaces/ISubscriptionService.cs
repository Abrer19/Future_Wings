using FutureWings.Application.DTOs.Subscription;

namespace FutureWings.Application.Interfaces;

public interface ISubscriptionService
{
    IReadOnlyList<SubscriptionPlanDto> GetPlans();
    Task<SubscriptionStatusDto> GetStatusAsync(int userId);
    Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int userId, string tier, string returnUrl);
    /// Applies a verified Stripe event. Returns true when it changed something.
    Task<bool> ApplyWebhookAsync(string payload, string signatureHeader);

    /// <summary>
    /// Grants a tier WITHOUT taking payment, for local development and demos.
    /// Implementations must refuse unless simulation is explicitly enabled.
    /// </summary>
    Task<SubscriptionStatusDto> SimulateUpgradeAsync(int userId, string tier);
}
