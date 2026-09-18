using FutureWings.Application.DTOs.Scholarship;

namespace FutureWings.Application.Interfaces;

public interface IScholarshipService
{
    Task<IReadOnlyList<ScholarshipDto>> GetAllAsync(int? countryId = null, string? search = null);
    Task<ScholarshipDto?> GetByIdAsync(int id);
}
