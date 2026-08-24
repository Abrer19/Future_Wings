using Microsoft.AspNetCore.SignalR;

namespace FutureWings.Web.Hubs;

public class NotificationHub : Hub
{
    public Task SendNotificationAsync(string userId, string message) =>
        Clients.User(userId).SendAsync("ReceiveNotification", message);
}
