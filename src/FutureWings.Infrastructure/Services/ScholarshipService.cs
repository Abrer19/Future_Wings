using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public class ScholarshipService(FutureWingsDbContext context) : IScholarshipService
{
    public async Task<IReadOnlyList<ScholarshipDto>> GetAllAsync()
    {
        return await context.Scholarships
            .AsNoTracking()
            .Select(s => new ScholarshipDto
            {
                Id = s.Id,
                CountryId = s.CountryId,
                Name = s.Name,
                EligibilityCriteria = "International applicants with strong academic record & merit",
                AwardAmount = 10000m
            })
            .ToListAsync();
    }
}

