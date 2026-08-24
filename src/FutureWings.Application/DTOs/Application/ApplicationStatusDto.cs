namespace FutureWings.Application.DTOs.Application;

public class ApplicationStatusDto
{
    public int ApplicationId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; }
}
