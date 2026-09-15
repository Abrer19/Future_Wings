using FutureWings.Application.DTOs.Agent;

namespace FutureWings.Application.Interfaces;

public interface IAgentService
{
    Task<IReadOnlyList<AgentCountryDto>> GetCountriesAsync();
    Task<AgentOverviewDto> GetCountryOverviewAsync(int? countryId);
    Task<IReadOnlyList<AgentApplicantDto>> GetApplicantsAsync(int? countryId, string? status);
    Task<bool> UpdateApplicantStatusAsync(int applicationId, string status);
    Task<bool> CreateProgramAsync(AgentCreateProgramDto dto);
    Task<bool> CreateScholarshipAsync(AgentCreateScholarshipDto dto);
    Task<bool> CreateUniversityAsync(AgentCreateUniversityDto dto);
}
