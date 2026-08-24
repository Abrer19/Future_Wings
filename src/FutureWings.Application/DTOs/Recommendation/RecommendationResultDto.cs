namespace FutureWings.Application.DTOs.Recommendation;

public class RecommendationResultDto
{
    public int UniversityId { get; set; }
    public int ProgramId { get; set; }
    public string UniversityName { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public decimal MatchScore { get; set; }
    public string Reason { get; set; } = string.Empty;
}
