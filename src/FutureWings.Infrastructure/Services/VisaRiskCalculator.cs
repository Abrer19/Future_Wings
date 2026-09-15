using FutureWings.Application.DTOs.Visa;

namespace FutureWings.Infrastructure.Services;

/// <summary>Deterministic preparation heuristic. Country values are planning estimates, not official thresholds.</summary>
public static class VisaRiskCalculator
{
    private sealed record Destination(decimal LivingUsd, decimal IeltsTarget, int DocumentationPoints);

    private static readonly Dictionary<string, Destination> Destinations = new(StringComparer.OrdinalIgnoreCase)
    {
        ["United States"] = new(20000, 6.5m, 8), ["USA"] = new(20000, 6.5m, 8),
        ["Canada"] = new(18000, 6.5m, 6), ["United Kingdom"] = new(18000, 6.5m, 6),
        ["UK"] = new(18000, 6.5m, 6), ["Australia"] = new(20000, 6.5m, 6),
        ["Germany"] = new(13000, 6.0m, 4),
        ["Netherlands"] = new(16000, 6.0m, 4),
        ["Finland"] = new(14000, 6.0m, 4),
    };

    public static VisaRiskResultDto Calculate(VisaAssessmentRequestDto request, int applicationId = 0,
        decimal? tuitionUsd = null, string? programLevel = null, string? profileMajor = null,
        string? programName = null, string? programTags = null)
    {
        var reasons = new List<string>();
        var recommendations = new List<string>();
        var score = 0;
        var destination = Destinations.GetValueOrDefault(request.DestinationCountry.Trim());
        if (destination is null)
        {
            score += 8;
            reasons.Add("Destination-specific document and cost requirements have not been verified.");
            recommendations.Add("Check the destination's official student visa guidance and funding rules.");
        }
        else
        {
            score += destination.DocumentationPoints;
            reasons.Add("Check destination-specific document requirements before applying.");
            recommendations.Add("Confirm current student visa requirements with the destination's official immigration site.");
        }

        if (!request.HasFundingProof)
        {
            score += 22;
            reasons.Add("Funding evidence is missing.");
            recommendations.Add("Prepare recent bank statements or a sponsor affidavit with supporting records.");
        }

        var tuition = tuitionUsd ?? request.AnnualTuitionUsd;
        var annualNeed = tuition.HasValue ? tuition.Value + (destination?.LivingUsd ?? 18000m) : (decimal?)null;
        if (annualNeed.HasValue && request.AvailableFundsUsd.HasValue)
        {
            if (request.AvailableFundsUsd.Value < annualNeed.Value)
            {
                score += 24;
                reasons.Add($"Estimated first-year tuition and living costs ({annualNeed.Value:N0} USD) exceed available funds.");
                recommendations.Add("Document additional funds or a sponsor to cover estimated first-year tuition and living costs.");
            }
        }
        else if (request.FinancialAdequacyScore < 70)
        {
            score += request.FinancialAdequacyScore < 40 ? 20 : 12;
            reasons.Add("Financial coverage is uncertain or below the planning target.");
            recommendations.Add("Compare documented funds with first-year tuition and the destination's official living-cost requirement.");
        }
        else if (!annualNeed.HasValue)
        {
            reasons.Add("Tuition amount is missing, so financial coverage cannot be verified.");
            recommendations.Add("Enter annual tuition and available funds to check first-year coverage.");
        }

        if (programLevel is not null && !string.Equals(request.DegreeLevel.Trim(), programLevel, StringComparison.OrdinalIgnoreCase))
        {
            score += 12;
            reasons.Add("Chosen degree level does not match the tracked program.");
            recommendations.Add("Align the assessment with the degree level on your admission offer.");
        }

        var major = profileMajor ?? request.IntendedMajor;
        if (programName is not null && !string.IsNullOrWhiteSpace(major))
        {
            var terms = major.Split([' ', ',', '-', '/'], StringSplitOptions.RemoveEmptyEntries)
                .Where(term => term.Length >= 4).ToArray();
            var description = $"{programName} {programTags}";
            if (terms.Length > 0 && !terms.Any(term => description.Contains(term, StringComparison.OrdinalIgnoreCase)))
            {
                score += 8;
                reasons.Add("The stated academic major does not clearly match the chosen program.");
                recommendations.Add("Explain your academic progression and why this program fits your study plan.");
            }
        }
        else if (string.IsNullOrWhiteSpace(major))
        {
            score += 6;
            reasons.Add("Academic background was not provided.");
            recommendations.Add("Add your academic major and explain how it supports the intended degree.");
        }

        if (!request.HasLanguageScore)
        {
            score += 18;
            reasons.Add("Language test evidence is missing.");
            recommendations.Add("Confirm the program's accepted language tests and submit a valid result.");
        }
        else if (request.IeltsOverallScore is decimal ielts && destination is not null && ielts < destination.IeltsTarget)
        {
            score += 14;
            reasons.Add($"IELTS overall score is below the {destination.IeltsTarget:0.0} planning benchmark.");
            recommendations.Add($"Check your program's requirement and aim for IELTS {destination.IeltsTarget:0.0} or above if IELTS is accepted.");
        }
        else if (request.IeltsOverallScore is null)
        {
            reasons.Add("Language score value was not provided.");
            recommendations.Add("Enter your test score and confirm the program's minimum and accepted test type.");
        }

        if (request.TiesToHomeCountryScore < 40)
        {
            score += 12;
            reasons.Add("Home-country ties need clearer supporting evidence.");
            recommendations.Add("Prepare evidence of family, work, or other home-country commitments where relevant.");
        }
        else if (request.TiesToHomeCountryScore < 70)
        {
            score += 6;
            reasons.Add("Home-country ties could be documented more clearly.");
            recommendations.Add("Organize credible evidence of your home-country commitments.");
        }

        if (request.HasPriorVisaRefusal)
        {
            score += 14;
            reasons.Add("A previous visa refusal needs a clear explanation.");
            recommendations.Add("Disclose the refusal accurately and address the reasons in your new application.");
        }

        score = Math.Clamp(score, 0, 100);
        return new VisaRiskResultDto
        {
            ApplicationId = applicationId, RiskScore = score,
            RiskLevel = score < 30 ? "Low" : score < 60 ? "Medium" : "High",
            Reasons = reasons, Recommendations = recommendations.Distinct().ToArray(),
        };
    }
}
