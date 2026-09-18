using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class ScholarshipService(FutureWingsDbContext context) : IScholarshipService
{
    public async Task<IReadOnlyList<ScholarshipDto>> GetAllAsync(int? countryId = null, string? search = null)
    {
        var query = context.Scholarships.AsNoTracking().Include(item => item.Country).AsQueryable();
        if (countryId.HasValue) query = query.Where(item => item.CountryId == countryId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var normalized = term.ToLower();
            query = query.Where(item => item.Name.ToLower().Contains(normalized) ||
                item.Country.Name.ToLower().Contains(normalized));
        }
        return await query.OrderBy(item => item.Deadline).ThenBy(item => item.Name)
            .Select(item => ToDto(item)).ToListAsync();
    }

    public async Task<ScholarshipDto?> GetByIdAsync(int id) =>
        await context.Scholarships.AsNoTracking().Include(item => item.Country)
            .Where(item => item.Id == id).Select(item => ToDto(item)).SingleOrDefaultAsync();

    private static ScholarshipDto ToDto(FutureWings.Domain.Entities.Scholarship item) => new()
    {
        Id = item.Id, CountryId = item.CountryId, CountryName = item.Country.Name,
        Name = item.Name, EligibilityCriteria = item.EligibilityCriteria,
        AwardAmount = item.AwardAmount, Deadline = item.Deadline,
    };
}
