using FutureWings.Application.DTOs.Visa;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

/// <summary>Produces an advisory readiness score, not a prediction of an official decision.</summary>
public sealed class VisaService(FutureWingsDbContext context) : IVisaService
{
    private static readonly IReadOnlyDictionary<string, decimal> CountryRisk =
        new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["United States"] = 14m, ["USA"] = 14m, ["United Kingdom"] = 11m,
            ["UK"] = 11m, ["Canada"] = 10m, ["Australia"] = 10m,
            ["Germany"] = 7m, ["France"] = 8m,
        };

    public async Task<VisaRiskResultDto> EvaluateRiskAsync(int userId, VisaAssessmentRequestDto request)
    {
        var profile = await context.UserProfiles.AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == userId);
        var academicMatch = DegreeMatches(profile?.DegreeLevel, request.DegreeLevel) ? 85 : 55;
        return Calculate(0, request, academicMatch);
    }

    public async Task<VisaRiskResultDto?> GetRiskForApplicationAsync(int userId, int applicationId)
    {
        var item = await context.Applications.AsNoTracking()
            .Where(application => application.Id == applicationId && application.UserId == userId)
            .Select(application => new
            {
                application.Id,
                application.Program.Level,
                application.Program.AnnualTuitionUsd,
                application.Program.MatchScore,
                Country = application.Program.University.Country.Name,
                Budget = application.User.Profile == null ? null : application.User.Profile.BudgetUsd,
            })
            .SingleOrDefaultAsync();

        if (item is null) return null;

        const decimal livingCostEstimate = 15_000m;
        var requiredFunds = item.AnnualTuitionUsd + livingCostEstimate;
        var financialScore = requiredFunds <= 0 || item.Budget is null
            ? 0
            : (int)Math.Clamp(decimal.Round(item.Budget.Value / requiredFunds * 100m), 0m, 100m);

        var request = new VisaAssessmentRequestDto
        {
            DestinationCountry = item.Country,
            DegreeLevel = item.Level,
            HasFundingProof = item.Budget is not null,
            HasLanguageScore = false,
            FinancialAdequacyScore = financialScore,
            TiesToHomeCountryScore = 50,
        };
        return Calculate(item.Id, request, item.MatchScore);
    }

    internal static VisaRiskResultDto Calculate(int applicationId, VisaAssessmentRequestDto request, int academicMatchScore = 70)
    {
        var reasons = new List<string>();
        var recommendations = new List<string>();
        decimal risk = CountryRisk.GetValueOrDefault(request.DestinationCountry.Trim(), 9m);

        if (!request.HasFundingProof)
        {
            risk += 22m;
            reasons.Add("Funding evidence is not yet documented.");
            recommendations.Add("Add bank statements and a sponsor affidavit covering tuition and living costs.");
        }
        else if (request.FinancialAdequacyScore < 80)
        {
            risk += request.FinancialAdequacyScore < 60 ? 18m : 10m;
            reasons.Add("Available funds may not fully cover tuition and estimated living costs.");
            recommendations.Add("Increase documented funds to cover at least one year of tuition plus living costs.");
        }
        else reasons.Add("Funding evidence appears adequate for the stated study plan.");

        if (!request.HasLanguageScore || request.LanguageTestScore is null)
        {
            risk += 18m;
            reasons.Add("No verified language-test score was provided.");
            recommendations.Add("Add a valid language result; target IELTS 6.5 or the institution's higher requirement.");
        }
        else if (request.LanguageTestScore < 6.5m)
        {
            risk += 14m;
            reasons.Add("The reported language score is below a common 6.5 benchmark.");
            recommendations.Add("Retake the language test and score at least 6.5 IELTS-equivalent.");
        }
        else reasons.Add("The reported language score meets the general readiness benchmark.");

        if (academicMatchScore < 60)
        {
            risk += 16m;
            reasons.Add("The proposed degree has a weak match with the current academic profile.");
            recommendations.Add("Prepare a study-purpose statement explaining the academic progression and career goal.");
        }
        else if (academicMatchScore < 75)
        {
            risk += 8m;
            reasons.Add("The academic progression needs a clear supporting explanation.");
            recommendations.Add("Connect the chosen program to prior study or relevant work in the statement of purpose.");
        }
        else reasons.Add("The proposed study level is consistent with the academic profile.");

        if (request.TiesToHomeCountryScore < 50)
        {
            risk += 13m;
            reasons.Add("Evidence of reasons to return home is limited.");
            recommendations.Add("Document family, employment, property, or career commitments in the home country.");
        }

        if (request.HasPriorVisaRefusal)
        {
            risk += 15m;
            reasons.Add("A prior visa refusal requires complete disclosure and remediation.");
            recommendations.Add("Attach the refusal letter and explain how every cited concern has been resolved.");
        }

        risk = Math.Clamp(decimal.Round(risk, 0), 0m, 100m);
        if (recommendations.Count == 0)
            recommendations.Add("Keep all supporting documents current and verify country-specific requirements before filing.");

        return new VisaRiskResultDto
        {
            ApplicationId = applicationId,
            RiskScore = risk,
            RiskLevel = risk < 35m ? "Low" : risk < 65m ? "Medium" : "High",
            Reasons = reasons,
            Recommendations = recommendations,
        };
    }

    private static bool DegreeMatches(string? currentDegree, string targetDegree)
    {
        if (string.IsNullOrWhiteSpace(currentDegree)) return false;
        var currentRank = DegreeRank(currentDegree);
        var targetRank = DegreeRank(targetDegree);
        return currentRank > 0 && targetRank >= currentRank && targetRank <= currentRank + 1;
    }

    private static int DegreeRank(string value) => value.Trim().ToLowerInvariant() switch
    {
        "high school" or "secondary" => 1,
        "bachelor" or "bachelors" or "undergraduate" => 2,
        "master" or "masters" or "postgraduate" => 3,
        "phd" or "doctorate" => 4,
        _ => 0,
    };
}
