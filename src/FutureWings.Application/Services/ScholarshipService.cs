using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class ScholarshipService : IScholarshipService
{
    public Task<IReadOnlyList<ScholarshipDto>> GetAllAsync()
    {
        IReadOnlyList<ScholarshipDto> scholarships = [];
        return Task.FromResult(scholarships);
    }
}
