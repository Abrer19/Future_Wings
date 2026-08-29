namespace FutureWings.Application.DTOs.Admin;

public class AdminUserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    public int ApplicationCount { get; set; }
    public int DeadlineCount { get; set; }
}
