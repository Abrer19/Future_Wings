using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Always returns an empty list; the Scholarships table is never queried.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IScholarshipService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
public class ScholarshipService : IScholarshipService
{
    public Task<IReadOnlyList<ScholarshipDto>> GetAllAsync()
    {
        IReadOnlyList<ScholarshipDto> scholarships = [];
        return Task.FromResult(scholarships);
    }
}
