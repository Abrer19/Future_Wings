namespace FutureWings.Application.DTOs.Scholarship;

public class ScholarshipChecklistStepDto
{
    public int Id { get; set; }
    public int ScholarshipInterestId { get; set; }
    public string StepKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int StepOrder { get; set; }
    public bool IsCompleted { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
