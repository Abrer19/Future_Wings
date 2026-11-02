using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class ScholarshipControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public ScholarshipControllerTests(FutureWingsWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void EnsureUserAndScholarship(int userId, string email, out int scholarshipId)
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
        }

        var country = context.Countries.FirstOrDefault(c => c.Code == "CA");
        if (country == null)
        {
            country = new Country { Name = "Canada", Code = "CA", Description = "Canada description" };
            context.Countries.Add(country);
            context.SaveChanges();
        }

        var scholarship = context.Scholarships.FirstOrDefault(s => s.Name == "Integration Test Award");
        if (scholarship == null)
        {
            scholarship = new Scholarship
            {
                Name = "Integration Test Award",
                CountryId = country.Id,
                AwardAmount = 20000m,
                Description = "Award for integration testing",
                EligibilityCriteria = "Test GPA 3.5+",
                RequiredDocuments = "Transcripts, References",
                StudyLevel = "Master's",
                FieldOfStudy = "Computer Science",
                OfficialLink = "https://example.com/scholarship",
                Deadline = DateTimeOffset.UtcNow.AddMonths(4)
            };
            context.Scholarships.Add(scholarship);
            context.SaveChanges();
        }

        scholarshipId = scholarship.Id;
        context.SaveChanges();
    }

    private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string url, int userId, string email)
    {
        var token = FutureWingsWebFactory.GenerateTestToken(userId: userId, email: email);
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    [Fact]
    public async Task GetAll_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/scholarship");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsScholarshipWithAllFields()
    {
        EnsureUserAndScholarship(81, "scholarship_student81@futurewings.io", out var scholarshipId);

        var request = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/scholarship/{scholarshipId}", 81, "scholarship_student81@futurewings.io");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ScholarshipDto>();
        Assert.NotNull(dto);
        Assert.Equal("Integration Test Award", dto.Name);
        Assert.Equal("Award for integration testing", dto.Description);
        Assert.Equal("Transcripts, References", dto.RequiredDocuments);
        Assert.Equal("Master's", dto.StudyLevel);
        Assert.Equal("Computer Science", dto.FieldOfStudy);
        Assert.Equal("https://example.com/scholarship", dto.OfficialLink);
    }

    [Fact]
    public async Task GetById_MissingScholarship_ReturnsNotFound()
    {
        EnsureUserAndScholarship(82, "scholarship_student82@futurewings.io", out _);

        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/scholarship/999999", 82, "scholarship_student82@futurewings.io");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ExpressInterest_CreatesProcessAndIsIdempotent()
    {
        EnsureUserAndScholarship(83, "scholarship_student83@futurewings.io", out var scholarshipId);

        // First call creates interest
        var request1 = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/scholarship/{scholarshipId}/interest", 83, "scholarship_student83@futurewings.io");
        var response1 = await _client.SendAsync(request1);
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        var interest1 = await response1.Content.ReadFromJsonAsync<ScholarshipInterestDto>();
        Assert.NotNull(interest1);
        Assert.NotEmpty(interest1.Steps);

        // Second call is idempotent
        var request2 = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/scholarship/{scholarshipId}/interest", 83, "scholarship_student83@futurewings.io");
        var response2 = await _client.SendAsync(request2);
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
        var interest2 = await response2.Content.ReadFromJsonAsync<ScholarshipInterestDto>();
        Assert.NotNull(interest2);
        Assert.Equal(interest1.Id, interest2.Id);
        Assert.Equal(interest1.Steps.Count, interest2.Steps.Count);
    }

    [Fact]
    public async Task UpdateChecklistStep_CanToggleAndEnforcesUserOwnership()
    {
        EnsureUserAndScholarship(84, "scholarship_student84@futurewings.io", out var scholarshipId);
        EnsureUserAndScholarship(85, "scholarship_student85@futurewings.io", out _);

        // User 84 expresses interest
        var requestInterest = CreateAuthenticatedRequest(HttpMethod.Post, $"/api/scholarship/{scholarshipId}/interest", 84, "scholarship_student84@futurewings.io");
        var resInterest = await _client.SendAsync(requestInterest);
        var interest = await resInterest.Content.ReadFromJsonAsync<ScholarshipInterestDto>();
        var stepId = interest!.Steps[0].Id;

        // User 84 marks complete
        var updateReq = CreateAuthenticatedRequest(HttpMethod.Put, $"/api/scholarship/{scholarshipId}/checklist/{stepId}", 84, "scholarship_student84@futurewings.io");
        updateReq.Content = JsonContent.Create(new UpdateChecklistStepDto { IsCompleted = true });
        var updateRes = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);
        var updatedStep = await updateRes.Content.ReadFromJsonAsync<ScholarshipChecklistStepDto>();
        Assert.True(updatedStep!.IsCompleted);

        // User 85 (another user) tries to modify User 84's checklist step -> returns 403 Forbidden
        var unauthorizedReq = CreateAuthenticatedRequest(HttpMethod.Put, $"/api/scholarship/{scholarshipId}/checklist/{stepId}", 85, "scholarship_student85@futurewings.io");
        unauthorizedReq.Content = JsonContent.Create(new UpdateChecklistStepDto { IsCompleted = false });
        var unauthorizedRes = await _client.SendAsync(unauthorizedReq);
        Assert.Equal(HttpStatusCode.Forbidden, unauthorizedRes.StatusCode);
    }
}
