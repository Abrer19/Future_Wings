using FutureWings.Application.DTOs.Recommendation;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class RecommendationService(FutureWingsDbContext context) : IRecommendationService
{
    public async Task<IReadOnlyList<RecommendationResultDto>> GetRecommendationsAsync(int userId)
    {
        var rows = await context.Programs
            .AsNoTracking()
            .OrderByDescending(program => program.MatchScore)
            .ThenBy(program => program.AnnualTuitionUsd)
            .Take(6)
            .Select(program => new
            {
                UniversityId = program.UniversityId,
                ProgramId = program.Id,
                UniversityName = program.University.Name,
                ProgramName = program.Name,
                MatchScore = (decimal)program.MatchScore,
                program.University.Country.Name,
                program.University.City,
                program.Level,
                program.AnnualTuitionUsd,
                program.DurationMonths,
                program.Tags,
                IsSaved = program.SavedByUsers.Any(saved => saved.UserId == userId)
            })
            .ToListAsync();

        return rows.Select(row => new RecommendationResultDto
        {
            UniversityId = row.UniversityId,
            ProgramId = row.ProgramId,
            UniversityName = row.UniversityName,
            ProgramName = row.ProgramName,
            MatchScore = row.MatchScore,
            Country = row.Name,
            City = row.City,
            Level = row.Level,
            AnnualTuitionUsd = row.AnnualTuitionUsd,
            DurationMonths = row.DurationMonths,
            Tags = row.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            IsSaved = row.IsSaved,
            Reason = BuildReason(row.MatchScore, row.Tags, row.Name)
        }).ToList();
    }

    private static string BuildReason(decimal score, string tags, string country)
    {
        var strengths = tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var highlight = strengths.FirstOrDefault() ?? "strong academic outcomes";
        return score >= 90
            ? $"Exceptional match with a focus on {highlight.ToLowerInvariant()} in {country}."
            : $"Strong option in {country}, especially for students interested in {highlight.ToLowerInvariant()}.";
    }
}
