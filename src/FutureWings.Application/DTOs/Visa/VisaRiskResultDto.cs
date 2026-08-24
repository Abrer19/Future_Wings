namespace FutureWings.Application.DTOs.Visa;

public class VisaRiskResultDto
{
    public int ApplicationId { get; set; }
    public decimal RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public IReadOnlyList<string> Reasons { get; set; } = [];
}
