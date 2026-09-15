using FutureWings.Application.DTOs.Agent;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Infrastructure.Services;

public sealed class AgentService(FutureWingsDbContext context) : IAgentService
{
    private const decimal BdtPerUsd = 120.00m;
    private const decimal CommissionRate = 0.15m; // 15% placement commission

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

        var appsInCountry = await context.Applications
            .AsNoTracking()
            .Where(a => a.Program.University.CountryId == country.Id)
            .Include(a => a.State)
            .Include(a => a.Program).ThenInclude(p => p.University)
            .ToListAsync();

        var total = appsInCountry.Count;
        var pending = appsInCountry.Count(a => a.State.Name == "Under Review");
        var submitted = appsInCountry.Count(a => a.State.Name == "Submitted");
        var pendingOrSubmitted = pending + submitted;
        var accepted = appsInCountry.Count(a => a.State.Name == "Accepted");
        var rejected = appsInCountry.Count(a => a.State.Name == "Rejected");
        var draft = appsInCountry.Count(a => a.State.Name == "Draft");

        var unisCount = await context.Universities.CountAsync(u => u.CountryId == country.Id);
        var programsCount = await context.Programs.CountAsync(p => p.University.CountryId == country.Id);
        var scholarshipsCount = await context.Scholarships.CountAsync(s => s.CountryId == country.Id);

        decimal acceptanceRate = total > 0 ? Math.Round(((decimal)accepted / total) * 100m, 1) : 0m;

        // Pipeline Tuition and Commissions (15% placement commission)
        decimal totalPipelineTuitionUsd = appsInCountry.Sum(a => a.Program?.AnnualTuitionUsd ?? 25000m);
        decimal totalPipelineTuitionTk = Math.Round(totalPipelineTuitionUsd * BdtPerUsd, 2);

        var acceptedApps = appsInCountry.Where(a => a.State.Name == "Accepted").ToList();
        decimal estimatedCommissionUsd = acceptedApps.Sum(a => (a.Program?.AnnualTuitionUsd ?? 25000m) * CommissionRate);
        if (estimatedCommissionUsd == 0 && total > 0)
        {
            // Projected pipeline commission on in-flight applications
            estimatedCommissionUsd = Math.Round(totalPipelineTuitionUsd * CommissionRate * 0.35m, 2);
        }
        decimal estimatedCommissionTk = Math.Round(estimatedCommissionUsd * BdtPerUsd, 2);

        // Stage Funnel Breakdown
        var stageBreakdown = new List<AgentStageMetricDto>
        {
            new() { Stage = "Draft", Count = draft, Percentage = total > 0 ? Math.Round(((decimal)draft / total) * 100m, 1) : 0m },
            new() { Stage = "Submitted", Count = submitted, Percentage = total > 0 ? Math.Round(((decimal)submitted / total) * 100m, 1) : 0m },
            new() { Stage = "Under Review", Count = pending, Percentage = total > 0 ? Math.Round(((decimal)pending / total) * 100m, 1) : 0m },
            new() { Stage = "Accepted", Count = accepted, Percentage = total > 0 ? Math.Round(((decimal)accepted / total) * 100m, 1) : 0m },
            new() { Stage = "Rejected", Count = rejected, Percentage = total > 0 ? Math.Round(((decimal)rejected / total) * 100m, 1) : 0m }
        };

        // Top Universities by Applicants
        var topUnis = appsInCountry
            .GroupBy(a => a.Program?.University?.Name ?? "Unknown")
            .Select(g => new AgentUniMetricDto
            {
                UniversityName = g.Key,
                ApplicantCount = g.Count()
            })
            .OrderByDescending(u => u.ApplicantCount)
            .Take(5)
            .ToList();

        // Degree Breakdown
        var degreeGroups = appsInCountry
            .GroupBy(a => a.Program?.Level ?? "Master's")
            .Select(g => new AgentDegreeMetricDto
            {
                Level = g.Key,
                Count = g.Count(),
                Percentage = total > 0 ? Math.Round(((decimal)g.Count() / total) * 100m, 1) : 0m
            })
            .OrderByDescending(d => d.Count)
            .ToList();

        return new AgentOverviewDto
        {
            CountryId = country.Id,
            CountryCode = country.Code,
            CountryName = country.Name,
            Description = country.Description,
            TotalApplicants = total,
            PendingReviewCount = pendingOrSubmitted,
            AcceptedCount = accepted,
            RejectedCount = rejected,
            SubmittedCount = submitted,
            DraftCount = draft,
            AcceptanceRatePercent = acceptanceRate,
            UniversitiesCount = unisCount,
            ProgramsCount = programsCount,
            ScholarshipsCount = scholarshipsCount,
            TotalPipelineTuitionUsd = totalPipelineTuitionUsd,
            TotalPipelineTuitionTk = totalPipelineTuitionTk,
            EstimatedCommissionUsd = estimatedCommissionUsd,
            EstimatedCommissionTk = estimatedCommissionTk,
            Currency = "Tk (BDT)",
            CurrencySymbol = "৳",
            StageBreakdown = stageBreakdown,
            TopUniversities = topUnis,
            DegreeBreakdown = degreeGroups
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

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
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
                BudgetTk = a.User.Profile != null && a.User.Profile.BudgetUsd.HasValue ? Math.Round(a.User.Profile.BudgetUsd.Value * BdtPerUsd, 2) : null,
                ProgramName = a.Program.Name,
                ProgramLevel = a.Program.Level,
                ProgramTuitionUsd = a.Program.AnnualTuitionUsd,
                ProgramTuitionTk = Math.Round(a.Program.AnnualTuitionUsd * BdtPerUsd, 2),
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

    public async Task<int> BatchUpdateApplicantStatusAsync(List<int> applicationIds, string status)
    {
        if (applicationIds == null || applicationIds.Count == 0) return 0;

        var state = await context.ApplicationStates.SingleOrDefaultAsync(s => s.Name.ToLower() == status.Trim().ToLower());
        if (state is null) return 0;

        var apps = await context.Applications
            .Where(a => applicationIds.Contains(a.Id))
            .ToListAsync();

        foreach (var app in apps)
        {
            app.ApplicationStateId = state.Id;
        }

        await context.SaveChangesAsync();
        return apps.Count;
    }

    public async Task<IReadOnlyList<AgentUniversityDto>> GetUniversitiesAsync(int? countryId)
    {
        var query = context.Universities.AsNoTracking().Include(u => u.Country).AsQueryable();

        if (countryId.HasValue && countryId.Value > 0)
        {
            query = query.Where(u => u.CountryId == countryId.Value);
        }

        return await query
            .OrderBy(u => u.Name)
            .Select(u => new AgentUniversityDto
            {
                Id = u.Id,
                CountryId = u.CountryId,
                CountryName = u.Country.Name,
                Name = u.Name,
                City = u.City,
                ProgramsCount = u.Programs.Count,
                ApplicantsCount = context.Applications.Count(a => a.Program.UniversityId == u.Id)
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<AgentProgramDto>> GetProgramsAsync(int? countryId)
    {
        var query = context.Programs
            .AsNoTracking()
            .Include(p => p.University).ThenInclude(u => u.Country)
            .AsQueryable();

        if (countryId.HasValue && countryId.Value > 0)
        {
            query = query.Where(p => p.University.CountryId == countryId.Value);
        }

        return await query
            .OrderBy(p => p.University.Name).ThenBy(p => p.Name)
            .Select(p => new AgentProgramDto
            {
                Id = p.Id,
                UniversityId = p.UniversityId,
                UniversityName = p.University.Name,
                CountryName = p.University.Country.Name,
                Name = p.Name,
                Level = p.Level,
                AnnualTuitionUsd = p.AnnualTuitionUsd,
                AnnualTuitionTk = Math.Round(p.AnnualTuitionUsd * BdtPerUsd, 2),
                DurationMonths = p.DurationMonths,
                MatchScore = p.MatchScore,
                Tags = p.Tags,
                ApplicantsCount = p.Applications.Count
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<AgentScholarshipDto>> GetScholarshipsAsync(int? countryId)
    {
        var query = context.Scholarships.AsNoTracking().Include(s => s.Country).AsQueryable();

        if (countryId.HasValue && countryId.Value > 0)
        {
            query = query.Where(s => s.CountryId == countryId.Value);
        }

        return await query
            .OrderBy(s => s.Name)
            .Select(s => new AgentScholarshipDto
            {
                Id = s.Id,
                CountryId = s.CountryId,
                CountryName = s.Country.Name,
                Name = s.Name
            })
            .ToListAsync();
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
            Tags = dto.Tags?.Trim() ?? string.Empty,
            MatchScore = 90
        };
        context.Programs.Add(prog);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteProgramAsync(int programId)
    {
        var prog = await context.Programs.SingleOrDefaultAsync(p => p.Id == programId);
        if (prog is null) return false;

        context.Programs.Remove(prog);
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

    public async Task<bool> DeleteScholarshipAsync(int scholarshipId)
    {
        var scholarship = await context.Scholarships.SingleOrDefaultAsync(s => s.Id == scholarshipId);
        if (scholarship is null) return false;

        context.Scholarships.Remove(scholarship);
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
