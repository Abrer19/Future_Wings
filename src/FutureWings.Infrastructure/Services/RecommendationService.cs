using FutureWings.Application.DTOs.Recommendation;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class RecommendationService(FutureWingsDbContext context) : IRecommendationService
{
    public async Task<IReadOnlyList<RecommendationResultDto>> GetRecommendationsAsync(int userId)
    {
        var profile = await context.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId);

        var savedProgramList = await context.SavedPrograms
            .AsNoTracking()
            .Where(sp => sp.UserId == userId)
            .Select(sp => sp.ProgramId)
            .ToListAsync();
        var savedProgramIds = savedProgramList.ToHashSet();

        var programs = await context.Programs
            .AsNoTracking()
            .Include(p => p.University)
            .ThenInclude(u => u.Country)
            .ToListAsync();

        if (programs.Count == 0) return [];

        var results = new List<RecommendationResultDto>();

        foreach (var program in programs)
        {
            var score = CalculateMatchScore(profile, program, out var reason);
            var tags = string.IsNullOrWhiteSpace(program.Tags)
                ? []
                : program.Tags.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

            results.Add(new RecommendationResultDto
            {
                ProgramId = program.Id,
                UniversityId = program.UniversityId,
                ProgramName = program.Name,
                UniversityName = program.University.Name,
                Country = program.University.Country.Name,
                City = program.University.City,
                Level = program.Level,
                AnnualTuitionUsd = program.AnnualTuitionUsd,
                DurationMonths = program.DurationMonths,
                Tags = tags,
                MatchScore = Math.Round(score, 1),
                Reason = reason,
                IsSaved = savedProgramIds.Contains(program.Id)
            });
        }

        return results
            .OrderByDescending(r => r.MatchScore)
            .ThenBy(r => r.ProgramName)
            .Take(12)
            .ToList();
    }

    private static decimal CalculateMatchScore(
        Domain.Entities.UserProfile? profile,
        Domain.Entities.Program program,
        out string reason)
    {
        decimal score = program.MatchScore > 0 ? program.MatchScore * 0.4m : 40m;
        var reasons = new List<string>();

        if (profile != null)
        {
            // Level match
            if (!string.IsNullOrWhiteSpace(profile.DegreeLevel))
            {
                if (string.Equals(profile.DegreeLevel, program.Level, StringComparison.OrdinalIgnoreCase))
                {
                    score += 25m;
                    reasons.Add($"Matches your target {program.Level} degree");
                }
                else
                {
                    score += 5m;
                }
            }
            else
            {
                score += 15m;
            }

            // Major / Subject keyword match
            if (!string.IsNullOrWhiteSpace(profile.Major))
            {
                var majorTokens = profile.Major.Split([' ', ',', '/'], StringSplitOptions.RemoveEmptyEntries);
                var isMatch = majorTokens.Any(token =>
                    program.Name.Contains(token, StringComparison.OrdinalIgnoreCase) ||
                    program.Tags.Contains(token, StringComparison.OrdinalIgnoreCase));

                if (isMatch)
                {
                    score += 20m;
                    reasons.Add($"Strong alignment with your interest in {profile.Major}");
                }
                else
                {
                    score += 5m;
                }
            }
            else
            {
                score += 10m;
            }

            // Budget match
            if (profile.BudgetUsd.HasValue && profile.BudgetUsd.Value > 0)
            {
                if (program.AnnualTuitionUsd <= profile.BudgetUsd.Value)
                {
                    score += 15m;
                    reasons.Add($"Tuition of ${program.AnnualTuitionUsd:N0}/yr fits within your ${profile.BudgetUsd.Value:N0}/yr budget");
                }
                else if (program.AnnualTuitionUsd <= profile.BudgetUsd.Value * 1.2m)
                {
                    score += 8m;
                    reasons.Add("Slightly above preferred budget, but scholarship opportunities may apply");
                }
            }
            else
            {
                score += 10m;
            }

            // CGPA match
            if (profile.Cgpa.HasValue && profile.Cgpa.Value >= 3.0m)
            {
                score += 10m;
                reasons.Add($"Your GPA ({profile.Cgpa.Value:F2}) meets competitive admission requirements");
            }
        }
        else
        {
            score += 30m;
            reasons.Add("Popular choice among international students in " + program.University.Country.Name);
        }

        if (reasons.Count == 0)
        {
            reasons.Add($"Recognized {program.Level} program in {program.University.Country.Name} with strong career outcomes.");
        }

        score = Math.Clamp(score, 50m, 99m);
        reason = string.Join(". ", reasons) + ".";
        return score;
    }
}
