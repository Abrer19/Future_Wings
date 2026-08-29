namespace FutureWings.Application.DTOs.Admin;

public class AdminApplicationDto
{
    public int Id { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public string Program { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
}
