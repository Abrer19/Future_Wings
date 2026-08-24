using FutureWings.Application.DTOs.Recommendation;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class RecommendationService : IRecommendationService
{
    public Task<IReadOnlyList<RecommendationResultDto>> GetRecommendationsAsync(int userId)
    {
        IReadOnlyList<RecommendationResultDto> results = [];
        return Task.FromResult(results);
    }
}
