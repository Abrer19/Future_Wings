using System.ComponentModel.DataAnnotations;

namespace FutureWings.Application.DTOs.Profile;

public class UpdateProfileDto
{
    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Range(0, 4.0, ErrorMessage = "CGPA must be between 0 and 4.")]
    public decimal? Cgpa { get; set; }

    [MaxLength(100)]
    public string? Major { get; set; }

    [Range(0, 1_000_000, ErrorMessage = "Budget must be a positive amount.")]
    public decimal? BudgetUsd { get; set; }

    [MaxLength(50)]
    public string? DegreeLevel { get; set; }
}
