using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Notification;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class NotificationControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public NotificationControllerTests(FutureWingsWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void EnsureUserExists(int userId, string email)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
        if (!context.Users.Any(u => u.Id == userId))
        {
            context.Users.Add(new User
            {
                Id = userId,
                Email = email,
                Role = "Student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPass123!")
            });
            context.SaveChanges();
        }
    }

    private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string url, int userId, string email)
    {
        EnsureUserExists(userId, email);
        var token = FutureWingsWebFactory.GenerateTestToken(userId: userId, email: email);
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    [Fact]
    public async Task GetAll_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/notifications");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_WithToken_ReturnsNotificationSummary()
    {
        var userId = 201;
        var email = "student201@test.com";

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            EnsureUserExists(userId, email);
            context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = "Scholarship Deadline Approaching",
                Message = "Your scholarship application is due soon.",
                Type = "scholarship_deadline",
                TargetPage = "Scholarships",
                TargetId = "5",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/notifications", userId, email);
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await response.Content.ReadFromJsonAsync<NotificationSummaryDto>();
        Assert.NotNull(summary);
        Assert.True(summary.UnreadCount >= 1);
        Assert.Contains(summary.Notifications, n => n.Title == "Scholarship Deadline Approaching");
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsValidCount()
    {
        var userId = 202;
        var email = "student202@test.com";

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            EnsureUserExists(userId, email);
            context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = "Document Reminder",
                Message = "Please upload your SOP.",
                Type = "profile_reminder",
                TargetPage = "Documents",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/notifications/unread-count", userId, email);
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<UnreadCountResponse>();
        Assert.NotNull(result);
        Assert.True(result.UnreadCount >= 1);
    }

    [Fact]
    public async Task MarkAsRead_MarksNotificationAndReturnsUpdated()
    {
        var userId = 203;
        var email = "student203@test.com";
        int notifId;

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            EnsureUserExists(userId, email);
            var notif = new Notification
            {
                UserId = userId,
                Title = "Status Update",
                Message = "Application submitted.",
                Type = "application_status",
                TargetPage = "Applications",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            context.Notifications.Add(notif);
            await context.SaveChangesAsync();
            notifId = notif.Id;
        }

        // Other user cannot mark as read
        var wrongUserReq = CreateAuthenticatedRequest(HttpMethod.Put, $"/api/notifications/{notifId}/read", 204, "student204@test.com");
        var wrongResp = await _client.SendAsync(wrongUserReq);
        Assert.Equal(HttpStatusCode.NotFound, wrongResp.StatusCode);

        // Owner marks as read
        var ownerReq = CreateAuthenticatedRequest(HttpMethod.Put, $"/api/notifications/{notifId}/read", userId, email);
        var ownerResp = await _client.SendAsync(ownerReq);
        Assert.Equal(HttpStatusCode.OK, ownerResp.StatusCode);

        var updated = await ownerResp.Content.ReadFromJsonAsync<NotificationDto>();
        Assert.NotNull(updated);
        Assert.True(updated.IsRead);
    }

    [Fact]
    public async Task MarkAllAsRead_MarksAllForUser()
    {
        var userId = 205;
        var email = "student205@test.com";

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            EnsureUserExists(userId, email);
            context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = "N1",
                Message = "M1",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = "N2",
                Message = "M2",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        var request = CreateAuthenticatedRequest(HttpMethod.Put, "/api/notifications/read-all", userId, email);
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<MarkedCountResponse>();
        Assert.NotNull(result);
        Assert.True(result.MarkedCount >= 2);
    }

    [Fact]
    public async Task Delete_DeletesNotificationOnlyForOwner()
    {
        var userId = 206;
        var email = "student206@test.com";
        int notifId;

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            EnsureUserExists(userId, email);
            var notif = new Notification
            {
                UserId = userId,
                Title = "To Delete",
                Message = "Del",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            context.Notifications.Add(notif);
            await context.SaveChangesAsync();
            notifId = notif.Id;
        }

        // Wrong user cannot delete
        var wrongReq = CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/notifications/{notifId}", 207, "student207@test.com");
        var wrongResp = await _client.SendAsync(wrongReq);
        Assert.Equal(HttpStatusCode.NotFound, wrongResp.StatusCode);

        // Owner deletes
        var ownerReq = CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/notifications/{notifId}", userId, email);
        var ownerResp = await _client.SendAsync(ownerReq);
        Assert.Equal(HttpStatusCode.NoContent, ownerResp.StatusCode);
    }

    private sealed record UnreadCountResponse(int UnreadCount);
    private sealed record MarkedCountResponse(int MarkedCount);
}
