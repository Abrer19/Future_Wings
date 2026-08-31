using FutureWings.Application.DTOs.Recommendation;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Always returns an empty list; no matching logic exists yet.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IRecommendationService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
public class RecommendationService : IRecommendationService
{
    public Task<IReadOnlyList<RecommendationResultDto>> GetRecommendationsAsync(int userId)
    {
        IReadOnlyList<RecommendationResultDto> results = [];
        return Task.FromResult(results);
    }
}
