using FutureWings.Application.DTOs.Agent;

namespace FutureWings.Application.Interfaces;

public interface IAgentService
{
    Task<IReadOnlyList<AgentCountryDto>> GetCountriesAsync();
    Task<AgentOverviewDto> GetCountryOverviewAsync(int? countryId);
    Task<IReadOnlyList<AgentApplicantDto>> GetApplicantsAsync(int? countryId, string? status);
    Task<bool> UpdateApplicantStatusAsync(int applicationId, string status);
    Task<int> BatchUpdateApplicantStatusAsync(List<int> applicationIds, string status);
    Task<IReadOnlyList<AgentUniversityDto>> GetUniversitiesAsync(int? countryId);
    Task<IReadOnlyList<AgentProgramDto>> GetProgramsAsync(int? countryId);
    Task<IReadOnlyList<AgentScholarshipDto>> GetScholarshipsAsync(int? countryId);
    Task<bool> CreateProgramAsync(AgentCreateProgramDto dto);
    Task<bool> DeleteProgramAsync(int programId);
    Task<bool> CreateScholarshipAsync(AgentCreateScholarshipDto dto);
    Task<bool> DeleteScholarshipAsync(int scholarshipId);
    Task<bool> CreateUniversityAsync(AgentCreateUniversityDto dto);
}
