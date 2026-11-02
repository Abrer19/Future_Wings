using FutureWings.Application.DTOs.Notification;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;

namespace FutureWings.Tests.Services;

public class NotificationServiceTests
{
    private class TestBroadcaster : INotificationBroadcaster
    {
        public List<(int UserId, NotificationDto Notification)> Broadcasts { get; } = new();

        public Task BroadcastToUserAsync(int userId, NotificationDto notification, CancellationToken cancellationToken = default)
        {
            Broadcasts.Add((userId, notification));
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task CreateNotificationAsync_PersistsNotificationAndBroadcasts()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        var result = await service.CreateNotificationAsync(
            userId: 1,
            title: "Test Title",
            message: "Test Message",
            type: "general",
            targetPage: "Dashboard",
            targetId: "10",
            eventKey: "test-event-1");

        Assert.NotNull(result);
        Assert.Equal("Test Title", result.Title);
        Assert.Equal("Test Message", result.Message);
        Assert.Equal("general", result.Type);
        Assert.Equal("Dashboard", result.TargetPage);
        Assert.Equal("10", result.TargetId);
        Assert.Equal("test-event-1", result.EventKey);
        Assert.False(result.IsRead);

        Assert.Single(broadcaster.Broadcasts);
        Assert.Equal(1, broadcaster.Broadcasts[0].UserId);
        Assert.Equal(result.Id, broadcaster.Broadcasts[0].Notification.Id);
    }

    [Fact]
    public async Task CreateNotificationAsync_DuplicateEventKey_DoesNotCreateDuplicate()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        var first = await service.CreateNotificationAsync(
            userId: 1,
            title: "First",
            message: "Msg",
            eventKey: "same-key");

        var second = await service.CreateNotificationAsync(
            userId: 1,
            title: "Second",
            message: "Msg 2",
            eventKey: "same-key");

        Assert.Equal(first.Id, second.Id);
        Assert.Equal("First", second.Title);
        Assert.Single(broadcaster.Broadcasts); // only broadcast once
    }

    [Fact]
    public async Task GetNotifications_UserIsolation_ReturnsOnlyOwnNotifications()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        await service.CreateNotificationAsync(userId: 1, title: "User 1 Note", message: "M1");
        await service.CreateNotificationAsync(userId: 2, title: "User 2 Note", message: "M2");

        var user1List = await service.GetNotificationsAsync(userId: 1);
        var user2List = await service.GetNotificationsAsync(userId: 2);

        Assert.Single(user1List);
        Assert.Equal("User 1 Note", user1List[0].Title);

        Assert.Single(user2List);
        Assert.Equal("User 2 Note", user2List[0].Title);
    }

    [Fact]
    public async Task MarkAsReadAsync_UpdatesStateAndTimestamp()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        var created = await service.CreateNotificationAsync(userId: 1, title: "Unread", message: "Test");
        Assert.False(created.IsRead);
        Assert.Null(created.ReadAt);

        var updated = await service.MarkAsReadAsync(userId: 1, created.Id);
        Assert.NotNull(updated);
        Assert.True(updated.IsRead);
        Assert.NotNull(updated.ReadAt);

        // Cannot mark someone else's notification
        var otherUserResult = await service.MarkAsReadAsync(userId: 2, created.Id);
        Assert.Null(otherUserResult);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_MarksAllUnreadForUser()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        await service.CreateNotificationAsync(userId: 1, title: "Note 1", message: "M1");
        await service.CreateNotificationAsync(userId: 1, title: "Note 2", message: "M2");
        await service.CreateNotificationAsync(userId: 2, title: "Note 3", message: "M3");

        var count = await service.MarkAllAsReadAsync(userId: 1);
        Assert.Equal(2, count);

        var unreadUser1 = await service.GetUnreadCountAsync(userId: 1);
        Assert.Equal(0, unreadUser1);

        var unreadUser2 = await service.GetUnreadCountAsync(userId: 2);
        Assert.Equal(1, unreadUser2);
    }

    [Fact]
    public async Task DeleteAsync_DeletesOnlyOwnNotification()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        var created = await service.CreateNotificationAsync(userId: 1, title: "To Delete", message: "M1");

        // Wrong user cannot delete
        var falseResult = await service.DeleteAsync(userId: 2, created.Id);
        Assert.False(falseResult);

        // Right user deletes successfully
        var trueResult = await service.DeleteAsync(userId: 1, created.Id);
        Assert.True(trueResult);

        var list = await service.GetNotificationsAsync(userId: 1);
        Assert.Empty(list);
    }

    [Fact]
    public async Task GenerateDeadlineRemindersAsync_TriggersIdempotentNotifications()
    {
        using var context = TestDbContextFactory.Create();
        var broadcaster = new TestBroadcaster();
        var service = new NotificationService(context, broadcaster, NullLogger<NotificationService>.Instance);

        var now = DateTimeOffset.UtcNow;

        // Overdue deadline
        context.Deadlines.Add(new Deadline
        {
            Id = 101,
            UserId = 1,
            Title = "Overdue Task",
            Category = "Application",
            DueAt = now.AddDays(-2),
            CreatedAt = now.AddDays(-10),
            CompletedAt = null
        });

        // 1-day deadline
        context.Deadlines.Add(new Deadline
        {
            Id = 102,
            UserId = 1,
            Title = "Due Tomorrow Task",
            Category = "Application",
            DueAt = now.AddHours(12),
            CreatedAt = now.AddDays(-5),
            CompletedAt = null
        });

        // 3-day deadline
        context.Deadlines.Add(new Deadline
        {
            Id = 103,
            UserId = 1,
            Title = "Due in 3 Days Task",
            Category = "Application",
            DueAt = now.AddDays(2.5),
            CreatedAt = now.AddDays(-5),
            CompletedAt = null
        });

        // 7-day deadline
        context.Deadlines.Add(new Deadline
        {
            Id = 104,
            UserId = 1,
            Title = "Due in 5 Days Task",
            Category = "Application",
            DueAt = now.AddDays(5),
            CreatedAt = now.AddDays(-5),
            CompletedAt = null
        });

        // 30-day deadline
        context.Deadlines.Add(new Deadline
        {
            Id = 105,
            UserId = 1,
            Title = "Due in 20 Days Task",
            Category = "Application",
            DueAt = now.AddDays(20),
            CreatedAt = now.AddDays(-5),
            CompletedAt = null
        });

        // Completed deadline (should NEVER generate notification)
        context.Deadlines.Add(new Deadline
        {
            Id = 106,
            UserId = 1,
            Title = "Completed Task",
            Category = "Application",
            DueAt = now.AddHours(6),
            CreatedAt = now.AddDays(-5),
            CompletedAt = now.AddHours(-1)
        });

        await context.SaveChangesAsync();

        // Run reminder generation
        await service.GenerateDeadlineRemindersAsync(userId: 1);

        var notifications = await service.GetNotificationsAsync(userId: 1);
        Assert.Equal(5, notifications.Count);

        Assert.Contains(notifications, n => n.Type == "deadline_overdue" && n.TargetId == "101");
        Assert.Contains(notifications, n => n.Type == "deadline_1d" && n.TargetId == "102");
        Assert.Contains(notifications, n => n.Type == "deadline_3d" && n.TargetId == "103");
        Assert.Contains(notifications, n => n.Type == "deadline_7d" && n.TargetId == "104");
        Assert.Contains(notifications, n => n.Type == "deadline_30d" && n.TargetId == "105");
        Assert.DoesNotContain(notifications, n => n.TargetId == "106"); // completed task excluded

        // Run again: Idempotent - no duplicates created!
        await service.GenerateDeadlineRemindersAsync(userId: 1);
        var secondRunList = await service.GetNotificationsAsync(userId: 1);
        Assert.Equal(5, secondRunList.Count);
    }
}
