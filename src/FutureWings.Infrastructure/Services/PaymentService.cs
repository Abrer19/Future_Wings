using FutureWings.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// Demo Stripe payment service implementation for demo and local development.
/// Strictly gated: rejects all calls in Production or when demo mode is not enabled.
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly IConfiguration? _configuration;

    public PaymentService(IConfiguration? configuration = null)
    {
        _configuration = configuration;
    }

    public Task<string> CreateSubscriptionAsync(int userId, string priceId)
    {
        if (string.IsNullOrWhiteSpace(priceId))
        {
            throw new ArgumentException("Price ID is required.", nameof(priceId));
        }

        var isProduction = string.Equals(_configuration?["ASPNETCORE_ENVIRONMENT"] ??
                                         Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                                         "Production",
                                         StringComparison.OrdinalIgnoreCase);

        var isDemoMode = (bool.TryParse(_configuration?["DemoMode:Enabled"], out var enabled) && enabled) ||
            string.Equals(_configuration?["FUTUREWINGS_DEMO_MODE"] ??
                          Environment.GetEnvironmentVariable("FUTUREWINGS_DEMO_MODE"),
                          "true",
                          StringComparison.OrdinalIgnoreCase);

        if (isProduction || !isDemoMode)
        {
            throw new InvalidOperationException("Payment processing is unavailable in this environment.");
        }

        return Task.FromResult($"sub_demo_{Guid.NewGuid():N}");
    }
}
