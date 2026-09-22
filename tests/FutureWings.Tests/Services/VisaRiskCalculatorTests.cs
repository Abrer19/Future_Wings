using FutureWings.Application.DTOs.Visa;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class VisaRiskCalculatorTests
{
    private static VisaAssessmentRequestDto ReadyRequest() => new()
    {
        DestinationCountry = "Canada",
        DegreeLevel = "Master's",
        HasFundingProof = true,
        HasLanguageScore = true,
        IeltsOverallScore = 7.5m,
        FinancialAdequacyScore = 90,
        TiesToHomeCountryScore = 90,
        AnnualTuitionUsd = 30000m,
        AvailableFundsUsd = 60000m,
        IntendedMajor = "Computer Science",
    };

    [Fact]
    public void Calculate_AllGood_ReturnsLowRisk()
    {
        var result = VisaRiskCalculator.Calculate(ReadyRequest());
        Assert.Equal("Low", result.RiskLevel);
        Assert.InRange(result.RiskScore, 0, 29);
    }

    [Fact]
    public void Calculate_MissingFundingProof_IncreasesScore()
    {
        var request = ReadyRequest();
        var baseline = VisaRiskCalculator.Calculate(request).RiskScore;
        request.HasFundingProof = false;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.True(result.RiskScore > baseline);
        Assert.Contains(result.Reasons, r => r.Contains("Funding"));
    }

    [Fact]
    public void Calculate_InsufficientFunds_IncreasesScore()
    {
        var request = ReadyRequest();
        request.AvailableFundsUsd = 10000m;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.Contains(result.Reasons, r => r.Contains("tuition and living"));
    }

    [Fact]
    public void Calculate_MissingLanguageScore_IncreasesScore()
    {
        var request = ReadyRequest();
        request.HasLanguageScore = false;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.Contains(result.Reasons, r => r.Contains("Language test"));
    }

    [Fact]
    public void Calculate_LowIelts_IncreasesScore()
    {
        var request = ReadyRequest();
        request.IeltsOverallScore = 5.0m;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.Contains(result.Reasons, r => r.Contains("IELTS"));
    }

    [Fact]
    public void Calculate_WeakHomeTies_IncreasesScore()
    {
        var request = ReadyRequest();
        request.TiesToHomeCountryScore = 20;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.Contains(result.Reasons, r => r.Contains("Home-country ties"));
    }

    [Fact]
    public void Calculate_PriorRefusal_IncreasesScore()
    {
        var request = ReadyRequest();
        var baseline = VisaRiskCalculator.Calculate(request).RiskScore;
        request.HasPriorVisaRefusal = true;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.True(result.RiskScore > baseline);
    }

    [Fact]
    public void Calculate_UnknownDestination_AddsWarning()
    {
        var request = ReadyRequest();
        request.DestinationCountry = "Narnia";
        var result = VisaRiskCalculator.Calculate(request);
        Assert.Contains(result.Recommendations, r => r.Contains("official student visa guidance"));
    }

    [Fact]
    public void Calculate_ScoreClampedTo100()
    {
        var request = ReadyRequest();
        request.HasFundingProof = false;
        request.HasLanguageScore = false;
        request.AvailableFundsUsd = 1m;
        request.TiesToHomeCountryScore = 0;
        request.HasPriorVisaRefusal = true;
        request.DestinationCountry = "Unknown";
        var result = VisaRiskCalculator.Calculate(request);
        Assert.InRange(result.RiskScore, 0, 100);
    }

    [Fact]
    public void Calculate_DegreeLevelMismatch_AddsReason()
    {
        var request = ReadyRequest();
        request.DegreeLevel = "Bachelor's";
        var result = VisaRiskCalculator.Calculate(request, programLevel: "Master's");
        Assert.Contains(result.Reasons, r => r.Contains("degree level"));
    }
}
