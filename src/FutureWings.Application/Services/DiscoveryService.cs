using FutureWings.Application.DTOs.Recommendation;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class DiscoveryService : IDiscoveryService
{
    public Task<IReadOnlyList<RecommendationResultDto>> SearchUniversitiesAsync(string query)
    {
        IReadOnlyList<RecommendationResultDto> results = [];
        return Task.FromResult(results);
    }
}
