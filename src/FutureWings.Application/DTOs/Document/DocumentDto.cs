namespace FutureWings.Application.DTOs.Document;

public sealed class DocumentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
}
