namespace FutureWings.Application.DTOs.Profile;

public class ProfileDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // Nullable: null distinguishes "not set yet" from a real value.
    public decimal? Cgpa { get; set; }
    public string? Major { get; set; }
    public decimal? BudgetUsd { get; set; }
    public string? DegreeLevel { get; set; }
}
