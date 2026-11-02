namespace FutureWings.Application.DTOs.Scholarship;

public class ScholarshipInterestDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ScholarshipId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<ScholarshipChecklistStepDto> Steps { get; set; } = [];
}
