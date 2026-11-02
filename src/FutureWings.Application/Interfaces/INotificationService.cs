using FutureWings.Application.DTOs.Notification;

namespace FutureWings.Application.Interfaces;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(int userId, bool unreadOnly = false, int limit = 50);
    Task<int> GetUnreadCountAsync(int userId);
    Task<NotificationDto?> MarkAsReadAsync(int userId, int notificationId);
    Task<int> MarkAllAsReadAsync(int userId);
    Task<bool> DeleteAsync(int userId, int notificationId);
    Task<NotificationDto> CreateNotificationAsync(
        int userId,
        string title,
        string message,
        string type = "general",
        string? targetPage = null,
        string? targetId = null,
        string? eventKey = null);
    Task GenerateDeadlineRemindersAsync(int userId);
}
