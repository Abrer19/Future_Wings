namespace FutureWings.Domain.Entities;

public class ScholarshipInterest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ScholarshipId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;
    public Scholarship Scholarship { get; set; } = null!;
    public ICollection<ScholarshipChecklistStep> Steps { get; set; } = [];
}
