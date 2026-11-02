namespace FutureWings.Application.DTOs.Notification;

public sealed record NotificationDto
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Type { get; init; } = "general";
    public string? TargetPage { get; init; }
    public string? TargetId { get; init; }
    public string? EventKey { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
}
