namespace FutureWings.Application.DTOs.Application;

public sealed class ApplicationCreateDto
{
    [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue)]
    public int ProgramId { get; set; }
}
