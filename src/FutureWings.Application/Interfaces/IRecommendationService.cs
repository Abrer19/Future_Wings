using FutureWings.Application.DTOs.Recommendation;

namespace FutureWings.Application.Interfaces;

public interface IRecommendationService
{
    Task<IReadOnlyList<RecommendationResultDto>> GetRecommendationsAsync(int userId);
}
