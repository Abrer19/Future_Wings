namespace FutureWings.Application.DTOs.Document;

public sealed class DocumentUploadDto
{
    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;
    [System.ComponentModel.DataAnnotations.Required]
    public byte[] Content { get; set; } = [];
}
