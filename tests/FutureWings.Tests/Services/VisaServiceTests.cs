using System.ComponentModel.DataAnnotations;
using FutureWings.Application.DTOs.Visa;
using FutureWings.Infrastructure.Services;
using FutureWings.Web.Controllers;
using Microsoft.AspNetCore.Authorization;

namespace FutureWings.Tests.Services;

public sealed class VisaServiceTests
{
    [Fact]
    public void Controller_RequiresAuthentication() =>
        Assert.NotNull(Attribute.GetCustomAttribute(typeof(VisaController), typeof(AuthorizeAttribute)));

    [Fact]
    public void StrongEvidence_ProducesLowRiskAndFallbackChecklistItem()
    {
        var result = VisaService.Calculate(12, Request(
            funding: true, financialScore: 100, languageScore: 7.5m, tiesScore: 90), 90);

        Assert.Equal(12, result.ApplicationId);
        Assert.Equal("Low", result.RiskLevel);
        Assert.InRange(result.RiskScore, 0m, 34m);
        Assert.NotEmpty(result.Recommendations);
    }

    [Fact]
    public void MissingEvidenceAndPriorRefusal_ProducesHighRiskWithActionableAdvice()
    {
        var request = Request(funding: false, financialScore: 20, languageScore: null, tiesScore: 20);
        request.HasPriorVisaRefusal = true;

        var result = VisaService.Calculate(0, request, 40);

        Assert.Equal("High", result.RiskLevel);
        Assert.InRange(result.RiskScore, 65m, 100m);
        Assert.Contains(result.Recommendations, item => item.Contains("sponsor affidavit", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Recommendations, item => item.Contains("refusal letter", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Recommendations, item => item.Contains("6.5", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BorderlineLanguageScore_AddsRetakeRecommendation()
    {
        var result = VisaService.Calculate(0, Request(
            funding: true, financialScore: 90, languageScore: 6m, tiesScore: 80), 85);

        Assert.Contains(result.Recommendations, item => item.Contains("Retake", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Request_RejectsOutOfRangeScoresAndMissingStudyPlan()
    {
        var request = new VisaAssessmentRequestDto
        {
            FinancialAdequacyScore = 101,
            TiesToHomeCountryScore = -1,
            LanguageTestScore = 10,
        };
        var validationResults = new List<ValidationResult>();

        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), validationResults, true));
        Assert.True(validationResults.Count >= 5);
    }

    private static VisaAssessmentRequestDto Request(bool funding, int financialScore, decimal? languageScore, int tiesScore) =>
        new()
        {
            DestinationCountry = "Germany",
            DegreeLevel = "Master",
            HasFundingProof = funding,
            FinancialAdequacyScore = financialScore,
            HasLanguageScore = languageScore is not null,
            LanguageTestScore = languageScore,
            TiesToHomeCountryScore = tiesScore,
        };
}
