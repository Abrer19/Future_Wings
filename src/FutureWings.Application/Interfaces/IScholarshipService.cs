using FutureWings.Application.DTOs.Scholarship;

namespace FutureWings.Application.Interfaces;

public interface IScholarshipService
{
    Task<IReadOnlyList<ScholarshipDto>> GetAllAsync(int? countryId = null, string? search = null, int? currentUserId = null);
    Task<ScholarshipDto?> GetByIdAsync(int id, int? currentUserId = null);
    Task<ScholarshipInterestDto> SetInterestAsync(int userId, int scholarshipId);
    Task<ScholarshipInterestDto?> GetProcessAsync(int userId, int scholarshipId);
    Task<ScholarshipChecklistStepDto> UpdateChecklistStepAsync(int userId, int scholarshipId, int stepId, bool isCompleted);
}
