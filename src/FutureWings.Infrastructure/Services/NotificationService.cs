using FutureWings.Application.DTOs.Notification;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FutureWings.Infrastructure.Services;

public sealed class NotificationService(
    FutureWingsDbContext context,
    INotificationBroadcaster broadcaster,
    ILogger<NotificationService> logger) : INotificationService
{
    public async Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(int userId, bool unreadOnly = false, int limit = 50)
    {
        var clampedLimit = Math.Clamp(limit, 1, 100);

        var query = context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(clampedLimit)
            .Select(n => Map(n))
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<NotificationDto?> MarkAsReadAsync(int userId, int notificationId)
    {
        var notification = await context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification is null)
        {
            return null;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        return Map(notification);
    }

    public async Task<int> MarkAllAsReadAsync(int userId)
    {
        var unread = await context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (unread.Count == 0)
        {
            return 0;
        }

        var now = DateTime.UtcNow;
        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ReadAt = now;
        }

        await context.SaveChangesAsync();
        return unread.Count;
    }

    public async Task<bool> DeleteAsync(int userId, int notificationId)
    {
        var notification = await context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification is null)
        {
            return false;
        }

        context.Notifications.Remove(notification);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<NotificationDto> CreateNotificationAsync(
        int userId,
        string title,
        string message,
        string type = "general",
        string? targetPage = null,
        string? targetId = null,
        string? eventKey = null)
    {
        if (!string.IsNullOrWhiteSpace(eventKey))
        {
            var existing = await context.Notifications
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.UserId == userId && n.EventKey == eventKey.Trim());

            if (existing is not null)
            {
                return Map(existing);
            }
        }

        var notification = new Notification
        {
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(title) ? "Notification" : title.Trim(),
            Message = string.IsNullOrWhiteSpace(message) ? string.Empty : message.Trim(),
            Type = string.IsNullOrWhiteSpace(type) ? "general" : type.Trim(),
            TargetPage = string.IsNullOrWhiteSpace(targetPage) ? null : targetPage.Trim(),
            TargetId = string.IsNullOrWhiteSpace(targetId) ? null : targetId.Trim(),
            EventKey = string.IsNullOrWhiteSpace(eventKey) ? null : eventKey.Trim(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        var dto = Map(notification);
        try
        {
            await broadcaster.BroadcastToUserAsync(userId, dto);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to broadcast notification {Id} to user {UserId}", notification.Id, userId);
        }

        return dto;
    }

    public async Task GenerateDeadlineRemindersAsync(int userId)
    {
        var deadlines = await context.Deadlines
            .AsNoTracking()
            .Where(d => d.UserId == userId && d.CompletedAt == null)
            .ToListAsync();

        if (deadlines.Count == 0)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var existingKeys = await context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId && n.EventKey != null)
            .Select(n => n.EventKey!)
            .ToListAsync();

        var existingKeySet = new HashSet<string>(existingKeys, StringComparer.OrdinalIgnoreCase);
        var newNotifications = new List<Notification>();

        foreach (var deadline in deadlines)
        {
            var remaining = deadline.DueAt - now;
            var days = remaining.TotalDays;

            if (days < 0)
            {
                var overdueKey = $"deadline-{deadline.Id}-overdue";
                if (!existingKeySet.Contains(overdueKey))
                {
                    existingKeySet.Add(overdueKey);
                    newNotifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = $"Overdue: {deadline.Title}",
                        Message = $"The deadline for '{deadline.Title}' was due on {deadline.DueAt:MMM dd, yyyy} and is now overdue.",
                        Type = "deadline_overdue",
                        TargetPage = "Dashboard",
                        TargetId = deadline.Id.ToString(),
                        EventKey = overdueKey,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (days <= 1.0)
            {
                var key1d = $"deadline-{deadline.Id}-1d";
                if (!existingKeySet.Contains(key1d))
                {
                    existingKeySet.Add(key1d);
                    newNotifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = $"Due Tomorrow: {deadline.Title}",
                        Message = $"The deadline for '{deadline.Title}' is due within 24 hours ({deadline.DueAt:MMM dd, yyyy}).",
                        Type = "deadline_1d",
                        TargetPage = "Dashboard",
                        TargetId = deadline.Id.ToString(),
                        EventKey = key1d,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (days <= 3.0)
            {
                var key3d = $"deadline-{deadline.Id}-3d";
                if (!existingKeySet.Contains(key3d))
                {
                    existingKeySet.Add(key3d);
                    newNotifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = $"Approaching Deadline: {deadline.Title}",
                        Message = $"The deadline for '{deadline.Title}' is due in {Math.Max(1, (int)Math.Ceiling(days))} days ({deadline.DueAt:MMM dd, yyyy}).",
                        Type = "deadline_3d",
                        TargetPage = "Dashboard",
                        TargetId = deadline.Id.ToString(),
                        EventKey = key3d,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (days <= 7.0)
            {
                var key7d = $"deadline-{deadline.Id}-7d";
                if (!existingKeySet.Contains(key7d))
                {
                    existingKeySet.Add(key7d);
                    newNotifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = $"Due Next Week: {deadline.Title}",
                        Message = $"The deadline for '{deadline.Title}' is due in {Math.Max(1, (int)Math.Ceiling(days))} days ({deadline.DueAt:MMM dd, yyyy}).",
                        Type = "deadline_7d",
                        TargetPage = "Dashboard",
                        TargetId = deadline.Id.ToString(),
                        EventKey = key7d,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (days <= 30.0)
            {
                var key30d = $"deadline-{deadline.Id}-30d";
                if (!existingKeySet.Contains(key30d))
                {
                    existingKeySet.Add(key30d);
                    newNotifications.Add(new Notification
                    {
                        UserId = userId,
                        Title = $"Upcoming Deadline: {deadline.Title}",
                        Message = $"The deadline for '{deadline.Title}' is scheduled for {deadline.DueAt:MMM dd, yyyy}.",
                        Type = "deadline_30d",
                        TargetPage = "Dashboard",
                        TargetId = deadline.Id.ToString(),
                        EventKey = key30d,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        if (newNotifications.Count > 0)
        {
            context.Notifications.AddRange(newNotifications);
            await context.SaveChangesAsync();

            foreach (var notification in newNotifications)
            {
                try
                {
                    await broadcaster.BroadcastToUserAsync(userId, Map(notification));
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to broadcast generated notification {Id} to user {UserId}", notification.Id, userId);
                }
            }
        }
    }

    private static NotificationDto Map(Notification n) => new()
    {
        Id = n.Id,
        UserId = n.UserId,
        Title = n.Title,
        Message = n.Message,
        Type = n.Type,
        TargetPage = n.TargetPage,
        TargetId = n.TargetId,
        EventKey = n.EventKey,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
        ReadAt = n.ReadAt
    };
}
