using System.ComponentModel.DataAnnotations;

namespace FutureWings.Application.DTOs.Visa;

public sealed class VisaAssessmentRequestDto
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string DestinationCountry { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 2)]
    public string DegreeLevel { get; set; } = string.Empty;

    public bool HasFundingProof { get; set; }
    public bool HasLanguageScore { get; set; }

    [Range(0, 100)]
    public int FinancialAdequacyScore { get; set; }

    [Range(0, 100)]
    public int TiesToHomeCountryScore { get; set; }

    [Range(0, 9)]
    public decimal? IeltsOverallScore { get; set; }

    [Range(0, 10000000)]
    public decimal? AvailableFundsUsd { get; set; }

    [Range(0, 1000000)]
    public decimal? AnnualTuitionUsd { get; set; }

    [StringLength(100)]
    public string? IntendedMajor { get; set; }

    public bool HasPriorVisaRefusal { get; set; }

    [Range(1, int.MaxValue)]
    public int? ApplicationId { get; set; }
}
