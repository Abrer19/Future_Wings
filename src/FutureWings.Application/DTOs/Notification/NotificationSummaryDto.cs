namespace FutureWings.Application.DTOs.Notification;

public sealed record NotificationSummaryDto
{
    public int UnreadCount { get; init; }
    public IReadOnlyList<NotificationDto> Notifications { get; init; } = Array.Empty<NotificationDto>();
}
