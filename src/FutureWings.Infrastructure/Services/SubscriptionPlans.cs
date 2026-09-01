namespace FutureWings.Infrastructure.Services;

/// <summary>
/// The three plans and what each unlocks.
///
/// Feature keys are the contract between server and client: the client gates
/// navigation on exactly this list, so a tier's capabilities are defined here once
/// rather than duplicated in the UI.
/// </summary>
public static class SubscriptionPlans
{
    public const string Free = "Free";
    public const string Pro = "Pro";
    public const string Premium = "Premium";

    // Feature keys.
    public const string FeatureDashboard = "dashboard";
    public const string FeatureDiscovery = "discovery";
    public const string FeatureRecommendations = "recommendations";
    public const string FeatureCommunity = "community";
    public const string FeatureProfile = "profile";
    public const string FeatureRoadmap = "roadmap";        // the mind map
    public const string FeatureAiInterview = "aiInterview"; // the mock interview

    /// Everything a Free account gets. Higher tiers are supersets.
    private static readonly string[] FreeFeatures =
    [
        FeatureDashboard, FeatureDiscovery, FeatureRecommendations, FeatureCommunity, FeatureProfile,
    ];

    private static readonly string[] ProFeatures = [.. FreeFeatures, FeatureRoadmap];

    private static readonly string[] PremiumFeatures = [.. ProFeatures, FeatureAiInterview];

    public static IReadOnlyList<string> FeaturesFor(string? tier) => tier switch
    {
        Premium => PremiumFeatures,
        Pro => ProFeatures,
        _ => FreeFeatures,
    };

    public static bool IsPaid(string tier) => tier is Pro or Premium;

    public static bool IsKnown(string tier) => tier is Free or Pro or Premium;

    public static IReadOnlyList<PlanDefinition> All =>
    [
        new(Free, "Free", "Everything you need to start planning.", 0m,
            ["Deadline dashboard", "Program discovery", "Recommendations", "Community"],
            FreeFeatures),
        new(Pro, "Pro", "Adds your visual study roadmap.", 9m,
            ["Everything in Free", "Study roadmap mind map", "Gap tracking and next steps"],
            ProFeatures),
        new(Premium, "Premium", "Adds interview practice.", 19m,
            ["Everything in Pro", "AI mock interviews", "Priority support"],
            PremiumFeatures),
    ];

    public sealed record PlanDefinition(
        string Tier,
        string Name,
        string Description,
        decimal MonthlyPriceUsd,
        IReadOnlyList<string> Highlights,
        IReadOnlyList<string> Features);
}
