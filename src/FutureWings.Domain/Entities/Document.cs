namespace FutureWings.Domain.Entities;

public class Document
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
    public DateTimeOffset UploadedAt { get; set; }

    public User User { get; set; } = null!;
}
