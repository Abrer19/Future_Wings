using FutureWings.Application.DTOs.Notification;
using FutureWings.Application.Interfaces;
using FutureWings.Web.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace FutureWings.Web.Services;

public sealed class SignalRNotificationBroadcaster(
    IHubContext<NotificationHub> hubContext,
    ILogger<SignalRNotificationBroadcaster> logger) : INotificationBroadcaster
{
    public async Task BroadcastToUserAsync(int userId, NotificationDto notification, CancellationToken cancellationToken = default)
    {
        try
        {
            await hubContext.Clients.User(userId.ToString())
                .SendAsync("ReceiveNotification", notification, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to broadcast notification {Id} to user {UserId}", notification.Id, userId);
        }
    }
}
