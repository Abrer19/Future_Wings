namespace FutureWings.Application.DTOs.Subscription;

/// A plan shown on the pricing page.
public class SubscriptionPlanDto
{
    public string Tier { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyPriceUsd { get; set; }
    public IReadOnlyList<string> Highlights { get; set; } = [];
    /// Feature keys this tier unlocks. The client gates navigation on these.
    public IReadOnlyList<string> Features { get; set; } = [];
    /// False when no Stripe price id is configured for a paid tier.
    public bool Purchasable { get; set; }
}

/// The signed-in user's current entitlement state.
public class SubscriptionStatusDto
{
    public string Tier { get; set; } = "Free";
    public IReadOnlyList<string> Features { get; set; } = [];
    public DateTimeOffset? RenewsAt { get; set; }
    public bool StripeConfigured { get; set; }

    /// <summary>
    /// True when simulated (fake) checkout is available. Development only, and only
    /// while no real Stripe key is configured.
    /// </summary>
    public bool SimulationEnabled { get; set; }
}

public class CheckoutSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public string CheckoutUrl { get; set; } = string.Empty;
}
