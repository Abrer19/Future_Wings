using FutureWings.Application.DTOs.Discovery;

namespace FutureWings.Application.Interfaces;

public interface IDiscoveryService
{
    Task<DiscoveryResultDto> SearchAsync(int userId, string? query, string? country, string? level);
    Task<IReadOnlyList<DiscoveryCountryDto>> GetCountriesAsync();
    Task<IReadOnlyList<DiscoveryProgramDto>> GetSavedProgramsAsync(int userId);
    Task<bool> SaveProgramAsync(int userId, int programId);
    Task<bool> RemoveSavedProgramAsync(int userId, int programId);
}
