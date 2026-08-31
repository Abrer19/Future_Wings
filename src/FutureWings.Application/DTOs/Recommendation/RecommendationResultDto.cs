namespace FutureWings.Application.DTOs.Recommendation;

public class RecommendationResultDto
{
    public int UniversityId { get; set; }
    public int ProgramId { get; set; }
    public string UniversityName { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public decimal MatchScore { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal AnnualTuitionUsd { get; set; }
    public int DurationMonths { get; set; }
    public IReadOnlyList<string> Tags { get; set; } = [];
    public bool IsSaved { get; set; }
}
