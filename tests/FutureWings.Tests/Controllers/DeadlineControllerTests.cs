using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using FutureWings.Application.DTOs.Deadline;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class DeadlineControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public DeadlineControllerTests(FutureWingsWebFactory factory)
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
        var response = await _client.GetAsync("/api/deadlines");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_MissingDueAt_ReturnsBadRequest()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        request.Content = new StringContent(
            "{\"title\": \"Task without DueAt\", \"category\": \"General\"}",
            Encoding.UTF8,
            "application/json"
        );

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_NullDueAt_ReturnsBadRequest()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        request.Content = new StringContent(
            "{\"title\": \"Task with Null DueAt\", \"category\": \"General\", \"dueAt\": null}",
            Encoding.UTF8,
            "application/json"
        );

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_InvalidDueAtText_ReturnsBadRequest()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        request.Content = new StringContent(
            "{\"title\": \"Task with Invalid Date\", \"category\": \"General\", \"dueAt\": \"not-a-valid-date\"}",
            Encoding.UTF8,
            "application/json"
        );

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_WrongJsonTypeDueAt_ReturnsBadRequest()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        request.Content = new StringContent(
            "{\"title\": \"Task with Number Date\", \"category\": \"General\", \"dueAt\": 123456789}",
            Encoding.UTF8,
            "application/json"
        );

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_Year0001DueAt_ReturnsBadRequest()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        request.Content = new StringContent(
            "{\"title\": \"Task with Year 0001\", \"category\": \"General\", \"dueAt\": \"0001-01-01T00:00:00Z\"}",
            Encoding.UTF8,
            "application/json"
        );

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_ValidUtcDueAt_ReturnsCreatedAndCleansUp()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        var expectedDue = new DateTimeOffset(2026, 12, 15, 12, 0, 0, TimeSpan.Zero);
        request.Content = JsonContent.Create(new DeadlineCreateDto
        {
            Title = "Valid UTC Task",
            Category = "Application",
            Notes = "Test notes",
            DueAt = expectedDue
        });

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<DeadlineDto>();
        Assert.NotNull(created);
        Assert.Equal("Valid UTC Task", created.Title);
        Assert.Equal(expectedDue.ToUniversalTime(), created.DueAt.ToUniversalTime());

        // Cleanup: Delete the temporary deadline
        var deleteReq = CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/deadlines/{created.Id}", 30, "student30@test.com");
        var deleteRes = await _client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);
    }

    [Fact]
    public async Task Create_ValidOffsetDueAt_ReturnsCreatedAndPreservesInstant()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        var offset = TimeSpan.FromHours(6);
        var expectedDue = new DateTimeOffset(2026, 12, 15, 18, 0, 0, offset);
        request.Content = JsonContent.Create(new DeadlineCreateDto
        {
            Title = "Valid Offset Task",
            Category = "Visa",
            DueAt = expectedDue
        });

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<DeadlineDto>();
        Assert.NotNull(created);
        Assert.Equal(expectedDue.ToUniversalTime(), created.DueAt.ToUniversalTime());

        // Cleanup: Delete the temporary deadline
        var deleteReq = CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/deadlines/{created.Id}", 30, "student30@test.com");
        var deleteRes = await _client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);
    }

    [Fact]
    public async Task Delete_CrossUser_ReturnsNotFound()
    {
        // User 30 creates a deadline
        var createReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/deadlines", 30, "student30@test.com");
        createReq.Content = JsonContent.Create(new DeadlineCreateDto
        {
            Title = "User 30 Task",
            Category = "General",
            DueAt = DateTimeOffset.UtcNow.AddDays(5)
        });
        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<DeadlineDto>();
        Assert.NotNull(created);

        // User 40 attempts to delete User 30's deadline
        var crossDeleteReq = CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/deadlines/{created.Id}", 40, "student40@test.com");
        var crossDeleteRes = await _client.SendAsync(crossDeleteReq);
        Assert.Equal(HttpStatusCode.NotFound, crossDeleteRes.StatusCode);

        // User 30 cleans up their own deadline
        var cleanupReq = CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/deadlines/{created.Id}", 30, "student30@test.com");
        var cleanupRes = await _client.SendAsync(cleanupReq);
        Assert.Equal(HttpStatusCode.NoContent, cleanupRes.StatusCode);
    }
}
