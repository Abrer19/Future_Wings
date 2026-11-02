using System.ComponentModel.DataAnnotations;

namespace FutureWings.Application.DTOs.Deadline;

public class DeadlineCreateDto : IValidatableObject
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Required]
    public DateTimeOffset? DueAt { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DueAt.HasValue && (DueAt.Value == default || DueAt.Value.Year <= 1))
        {
            yield return new ValidationResult("A valid due date and time is required.", new[] { nameof(DueAt) });
        }
    }
}
