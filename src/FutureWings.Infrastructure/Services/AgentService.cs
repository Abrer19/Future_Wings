using FutureWings.Application.DTOs.Agent;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Infrastructure.Services;

public sealed class AgentService(FutureWingsDbContext context) : IAgentService
{
    public async Task<IReadOnlyList<AgentCountryDto>> GetCountriesAsync()
    {
        return await context.Countries
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new AgentCountryDto
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                Description = c.Description,
                UniversitiesCount = c.Universities.Count,
                ApplicationsCount = context.Applications.Count(a => a.Program.University.CountryId == c.Id)
            })
            .ToListAsync();
    }

    public async Task<AgentOverviewDto> GetCountryOverviewAsync(int? countryId)
    {
        var countryQuery = context.Countries.AsNoTracking();
        Country? country = null;
        if (countryId.HasValue && countryId.Value > 0)
        {
            country = await countryQuery.FirstOrDefaultAsync(c => c.Id == countryId.Value);
        }

        if (country is null)
        {
            country = await countryQuery.OrderBy(c => c.Name).FirstOrDefaultAsync();
        }

        if (country is null)
        {
            return new AgentOverviewDto { CountryName = "Global" };
        }

        var appsInCountry = context.Applications
            .AsNoTracking()
            .Where(a => a.Program.University.CountryId == country.Id);

        var total = await appsInCountry.CountAsync();
        var pending = await appsInCountry.CountAsync(a => a.State.Name == "Under Review" || a.State.Name == "Submitted");
        var accepted = await appsInCountry.CountAsync(a => a.State.Name == "Accepted");
        var rejected = await appsInCountry.CountAsync(a => a.State.Name == "Rejected");
        var unisCount = await context.Universities.CountAsync(u => u.CountryId == country.Id);
        var scholarshipsCount = await context.Scholarships.CountAsync(s => s.CountryId == country.Id);

        return new AgentOverviewDto
        {
            CountryId = country.Id,
            CountryName = country.Name,
            TotalApplicants = total,
            PendingReviewCount = pending,
            AcceptedCount = accepted,
            RejectedCount = rejected,
            UniversitiesCount = unisCount,
            ScholarshipsCount = scholarshipsCount
        };
    }

    public async Task<IReadOnlyList<AgentApplicantDto>> GetApplicantsAsync(int? countryId, string? status)
    {
        var query = context.Applications
            .AsNoTracking()
            .Include(a => a.User).ThenInclude(u => u.Profile)
            .Include(a => a.Program).ThenInclude(p => p.University).ThenInclude(u => u.Country)
            .Include(a => a.State)
            .AsQueryable();

        if (countryId.HasValue && countryId.Value > 0)
        {
            query = query.Where(a => a.Program.University.CountryId == countryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.State.Name.ToLower() == status.Trim().ToLower());
        }

        return await query
            .OrderByDescending(a => a.SubmittedAt)
            .Select(a => new AgentApplicantDto
            {
                ApplicationId = a.Id,
                StudentId = a.UserId,
                StudentName = a.User.Profile != null ? $"{a.User.Profile.FirstName} {a.User.Profile.LastName}" : a.User.Email,
                StudentEmail = a.User.Email,
                Major = a.User.Profile != null ? a.User.Profile.Major : null,
                Cgpa = a.User.Profile != null ? a.User.Profile.Cgpa : null,
                BudgetUsd = a.User.Profile != null ? a.User.Profile.BudgetUsd : null,
                ProgramName = a.Program.Name,
                UniversityName = a.Program.University.Name,
                CountryName = a.Program.University.Country.Name,
                Status = a.State.Name,
                SubmittedAt = a.SubmittedAt
            })
            .ToListAsync();
    }

    public async Task<bool> UpdateApplicantStatusAsync(int applicationId, string status)
    {
        var app = await context.Applications.SingleOrDefaultAsync(a => a.Id == applicationId);
        if (app is null) return false;

        var state = await context.ApplicationStates.SingleOrDefaultAsync(s => s.Name.ToLower() == status.Trim().ToLower());
        if (state is null) return false;

        app.ApplicationStateId = state.Id;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreateProgramAsync(AgentCreateProgramDto dto)
    {
        var uni = await context.Universities.SingleOrDefaultAsync(u => u.Id == dto.UniversityId);
        if (uni is null) return false;

        var prog = new AcademicProgram
        {
            UniversityId = dto.UniversityId,
            Name = dto.Name.Trim(),
            Level = dto.Level.Trim(),
            AnnualTuitionUsd = dto.AnnualTuitionUsd,
            DurationMonths = dto.DurationMonths,
            Tags = dto.Tags.Trim(),
            MatchScore = 90
        };
        context.Programs.Add(prog);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreateScholarshipAsync(AgentCreateScholarshipDto dto)
    {
        var country = await context.Countries.SingleOrDefaultAsync(c => c.Id == dto.CountryId);
        if (country is null) return false;

        var scholarship = new Scholarship
        {
            CountryId = dto.CountryId,
            Name = dto.Name.Trim()
        };
        context.Scholarships.Add(scholarship);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreateUniversityAsync(AgentCreateUniversityDto dto)
    {
        var country = await context.Countries.SingleOrDefaultAsync(c => c.Id == dto.CountryId);
        if (country is null) return false;

        var uni = new University
        {
            CountryId = dto.CountryId,
            Name = dto.Name.Trim(),
            City = dto.City.Trim()
        };
        context.Universities.Add(uni);
        await context.SaveChangesAsync();
        return true;
    }
}
