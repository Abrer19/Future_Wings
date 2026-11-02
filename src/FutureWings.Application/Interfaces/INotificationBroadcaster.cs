using FutureWings.Application.DTOs.Notification;

namespace FutureWings.Application.Interfaces;

public interface INotificationBroadcaster
{
    Task BroadcastToUserAsync(int userId, NotificationDto notification, CancellationToken cancellationToken = default);
}
