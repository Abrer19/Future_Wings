namespace FutureWings.Application.DTOs.Admin;

public class AdminDeadlineDto
{
    public int Id { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTimeOffset DueAt { get; set; }
    public bool IsOverdue { get; set; }
}
