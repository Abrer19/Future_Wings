namespace FutureWings.Application.DTOs.Application;

public sealed class ApplicationDetailsDto
{
    public int ApplicationId { get; set; }
    public int ProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string UniversityName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
