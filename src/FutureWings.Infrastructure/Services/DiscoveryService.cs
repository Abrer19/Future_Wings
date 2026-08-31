using FutureWings.Application.DTOs.Discovery;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class DiscoveryService(FutureWingsDbContext context) : IDiscoveryService
{
    public async Task<DiscoveryResultDto> SearchAsync(int userId, string? query, string? country, string? level)
    {
        var programs = context.Programs.AsNoTracking().AsQueryable();
        var normalizedQuery = query?.Trim();
        var normalizedCountry = country?.Trim();
        var normalizedLevel = level?.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedQuery))
        {
            programs = programs.Where(program =>
                program.Name.Contains(normalizedQuery) ||
                program.University.Name.Contains(normalizedQuery) ||
                program.University.City.Contains(normalizedQuery) ||
                program.University.Country.Name.Contains(normalizedQuery) ||
                program.Tags.Contains(normalizedQuery));
        }

        if (!string.IsNullOrWhiteSpace(normalizedCountry))
        {
            programs = programs.Where(program => program.University.Country.Name == normalizedCountry);
        }

        if (!string.IsNullOrWhiteSpace(normalizedLevel))
        {
            programs = programs.Where(program => program.Level == normalizedLevel);
        }

        var totalCount = await programs.CountAsync();
        var rows = await programs
            .OrderByDescending(program => program.MatchScore)
            .ThenBy(program => program.Name)
            .Select(program => new
            {
                program.Id,
                program.Name,
                University = program.University.Name,
                Country = program.University.Country.Name,
                CountryCode = program.University.Country.Code,
                program.University.City,
                program.Level,
                program.AnnualTuitionUsd,
                program.DurationMonths,
                program.MatchScore,
                program.Tags,
                IsSaved = program.SavedByUsers.Any(saved => saved.UserId == userId)
            })
            .ToListAsync();

        var countries = await context.Countries.AsNoTracking()
            .OrderBy(item => item.Name)
            .Select(item => item.Name)
            .ToListAsync();
        var levels = await context.Programs.AsNoTracking()
            .Select(item => item.Level)
            .Distinct()
            .OrderBy(item => item)
            .ToListAsync();

        return new DiscoveryResultDto
        {
            FeaturedCountries = await GetFeaturedCountriesAsync(),
            Programs = rows.Select(row => new DiscoveryProgramDto
            {
                Id = row.Id,
                Name = row.Name,
                University = row.University,
                Country = row.Country,
                CountryCode = row.CountryCode,
                City = row.City,
                Level = row.Level,
                AnnualTuitionUsd = row.AnnualTuitionUsd,
                DurationMonths = row.DurationMonths,
                MatchScore = row.MatchScore,
                Tags = SplitTags(row.Tags),
                IsSaved = row.IsSaved
            }).ToList(),
            Countries = countries,
            Levels = levels,
            TotalCount = totalCount
        };
    }

    public Task<IReadOnlyList<DiscoveryCountryDto>> GetCountriesAsync() => GetCountryQuery(false);

    public async Task<IReadOnlyList<DiscoveryProgramDto>> GetSavedProgramsAsync(int userId)
    {
        var result = await SearchAsync(userId, null, null, null);
        return result.Programs.Where(program => program.IsSaved).ToList();
    }

    public async Task<bool> SaveProgramAsync(int userId, int programId)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId) ||
            !await context.Programs.AnyAsync(program => program.Id == programId))
        {
            return false;
        }

        if (await context.SavedPrograms.AnyAsync(saved => saved.UserId == userId && saved.ProgramId == programId))
        {
            return true;
        }

        context.SavedPrograms.Add(new SavedProgram { UserId = userId, ProgramId = programId });
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveSavedProgramAsync(int userId, int programId)
    {
        var savedProgram = await context.SavedPrograms.FindAsync(userId, programId);
        if (savedProgram is null) return false;

        context.SavedPrograms.Remove(savedProgram);
        await context.SaveChangesAsync();
        return true;
    }

    private Task<IReadOnlyList<DiscoveryCountryDto>> GetFeaturedCountriesAsync() => GetCountryQuery(true);

    private async Task<IReadOnlyList<DiscoveryCountryDto>> GetCountryQuery(bool featuredOnly)
    {
        var query = context.Countries.AsNoTracking().AsQueryable();
        if (featuredOnly) query = query.Where(country => country.IsFeatured);

        return await query
            .OrderByDescending(country => country.Universities.SelectMany(university => university.Programs).Count())
            .ThenBy(country => country.Name)
            .Select(country => new DiscoveryCountryDto
            {
                Id = country.Id,
                Name = country.Name,
                Code = country.Code,
                Description = country.Description,
                ProgramCount = country.Universities.SelectMany(university => university.Programs).Count()
            })
            .ToListAsync();
    }

    private static IReadOnlyList<string> SplitTags(string tags) => tags
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
