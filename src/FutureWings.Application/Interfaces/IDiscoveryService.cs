using FutureWings.Application.DTOs.Recommendation;

namespace FutureWings.Application.Interfaces;

public interface IDiscoveryService
{
    Task<IReadOnlyList<RecommendationResultDto>> SearchUniversitiesAsync(string query);
}
