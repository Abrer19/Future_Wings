using System.ComponentModel.DataAnnotations;

namespace FutureWings.Application.DTOs.Visa;

public sealed class VisaAssessmentRequestDto
{
    [Required, MaxLength(100)]
    public string DestinationCountry { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string DegreeLevel { get; set; } = string.Empty;

    public bool HasFundingProof { get; set; }
    public bool HasLanguageScore { get; set; }

    [Range(0, 100)]
    public int FinancialAdequacyScore { get; set; }

    [Range(0, 100)]
    public int TiesToHomeCountryScore { get; set; }

    [Range(0, 9)]
    public decimal? LanguageTestScore { get; set; }

    public bool HasPriorVisaRefusal { get; set; }
}
