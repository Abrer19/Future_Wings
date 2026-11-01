using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Application;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class ApplicationControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public ApplicationControllerTests(FutureWingsWebFactory factory)
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
        var response = await _client.GetAsync("/api/applications");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/applications", new ApplicationCreateDto
        {
            ProgramId = 1
        });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_WithValidToken_ReturnsSuccess()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/applications", 10, "student10@test.com");
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var list = await response.Content.ReadFromJsonAsync<List<ApplicationDetailsDto>>();
        Assert.NotNull(list);
    }

    [Fact]
    public async Task Get_WithUnknownId_ReturnsNotFound()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/applications/99999", 10, "student10@test.com");
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_CrossUser_ReturnsNotFound()
    {
        // User 10 creates an application
        var createReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/applications", 10, "student10@test.com");
        createReq.Content = JsonContent.Create(new ApplicationCreateDto { ProgramId = 1 });
        var createRes = await _client.SendAsync(createReq);
        Assert.True(createRes.IsSuccessStatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<ApplicationStatusDto>();
        Assert.NotNull(created);

        // User 20 attempts to access User 10's application
        var crossReq = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/applications/{created.ApplicationId}", 20, "student20@test.com");
        var crossRes = await _client.SendAsync(crossReq);
        Assert.Equal(HttpStatusCode.NotFound, crossRes.StatusCode);
    }

    [Fact]
    public async Task Create_WithNonExistentProgram_ReturnsNotFound()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/applications", 10, "student10@test.com");
        request.Content = JsonContent.Create(new ApplicationCreateDto { ProgramId = 99999 });

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_WithUnknownId_ReturnsNotFound()
    {
        var request = CreateAuthenticatedRequest(HttpMethod.Patch, "/api/applications/99999/status", 10, "student10@test.com");
        request.Content = JsonContent.Create(new ApplicationStatusUpdateDto { Status = "Submitted" });

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_CrossUser_ReturnsNotFound()
    {
        // User 10 creates an application
        var createReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/applications", 10, "student10@test.com");
        createReq.Content = JsonContent.Create(new ApplicationCreateDto { ProgramId = 2 });
        var createRes = await _client.SendAsync(createReq);
        Assert.True(createRes.IsSuccessStatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<ApplicationStatusDto>();
        Assert.NotNull(created);

        // User 20 attempts to update User 10's application
        var updateReq = CreateAuthenticatedRequest(HttpMethod.Patch, $"/api/applications/{created.ApplicationId}/status", 20, "student20@test.com");
        updateReq.Content = JsonContent.Create(new ApplicationStatusUpdateDto { Status = "Submitted" });

        var updateRes = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.NotFound, updateRes.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_WithInvalidStatus_ReturnsBadRequest()
    {
        // User 10 creates an application
        var createReq = CreateAuthenticatedRequest(HttpMethod.Post, "/api/applications", 10, "student10@test.com");
        createReq.Content = JsonContent.Create(new ApplicationCreateDto { ProgramId = 3 });
        var createRes = await _client.SendAsync(createReq);
        Assert.True(createRes.IsSuccessStatusCode);
        var created = await createRes.Content.ReadFromJsonAsync<ApplicationStatusDto>();
        Assert.NotNull(created);

        // User 10 tries to update to an invalid status
        var updateReq = CreateAuthenticatedRequest(HttpMethod.Patch, $"/api/applications/{created.ApplicationId}/status", 10, "student10@test.com");
        updateReq.Content = JsonContent.Create(new ApplicationStatusUpdateDto { Status = "InvalidNonExistentStatus" });

        var updateRes = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.BadRequest, updateRes.StatusCode);
    }
}
