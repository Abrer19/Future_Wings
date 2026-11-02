using System.Security.Claims;
using FutureWings.Application.DTOs.Notification;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false, [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        await notificationService.GenerateDeadlineRemindersAsync(userId);
        var notifications = await notificationService.GetNotificationsAsync(userId, unreadOnly, limit);
        var unreadCount = await notificationService.GetUnreadCountAsync(userId);

        return Ok(new NotificationSummaryDto
        {
            UnreadCount = unreadCount,
            Notifications = notifications
        });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        await notificationService.GenerateDeadlineRemindersAsync(userId);
        var count = await notificationService.GetUnreadCountAsync(userId);
        return Ok(new { unreadCount = count });
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await notificationService.MarkAsReadAsync(GetUserId(), id);
        return notification is null
            ? NotFound(new { message = "Notification not found." })
            : Ok(notification);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var count = await notificationService.MarkAllAsReadAsync(GetUserId());
        return Ok(new { markedCount = count });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await notificationService.DeleteAsync(GetUserId(), id);
        return deleted
            ? NoContent()
            : NotFound(new { message = "Notification not found." });
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
