using System.ComponentModel.DataAnnotations;

namespace FutureWings.Application.DTOs.Application;

public sealed class ApplicationStatusUpdateDto
{
    [Required, MaxLength(50)]
    public string Status { get; set; } = string.Empty;
}
