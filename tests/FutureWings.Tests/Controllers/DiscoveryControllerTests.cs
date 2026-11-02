using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Discovery;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Tests.Controllers;

public class DiscoveryControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public DiscoveryControllerTests(FutureWingsWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void EnsureUserAndProgramExist(int userId, string email, out int programId)
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

        var country = context.Countries.FirstOrDefault(c => c.Code == "DE");
        if (country is null)
        {
            country = new Country { Name = "Germany", Code = "DE", Description = "Test", IsFeatured = true };
            context.Countries.Add(country);
            context.SaveChanges();
        }

        var uni = context.Universities.FirstOrDefault(u => u.Name == "TU Munich");
        if (uni is null)
        {
            uni = new University { CountryId = country.Id, Name = "TU Munich", City = "Munich" };
            context.Universities.Add(uni);
            context.SaveChanges();
        }

        var program = context.Programs.FirstOrDefault(p => p.Name == "MSc Informatics Test");
        if (program is null)
        {
            program = new AcademicProgram
            {
                UniversityId = uni.Id,
                Name = "MSc Informatics Test",
                Level = "Master's",
                AnnualTuitionUsd = 1200,
                DurationMonths = 24,
                MatchScore = 95,
                Tags = "AI & Robotics, Systems",
                Description = "High-ranking German CS master program.",
                Requirements = "BSc in CS, English B2/C1.",
                OfficialLink = "https://tum.de"
            };
            context.Programs.Add(program);
            context.SaveChanges();
        }

        programId = program.Id;
        context.SaveChanges();
    }

    private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string url, int userId, string email)
    {
        EnsureUserAndProgramExist(userId, email, out _);
        var token = FutureWingsWebFactory.GenerateTestToken(userId: userId, email: email);
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    [Fact]
    public async Task Search_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/discovery");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Search_WithToken_ReturnsProgramsAndStudyTracks()
    {
        EnsureUserAndProgramExist(301, "discovery301@test.com", out _);
        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/discovery", 301, "discovery301@test.com");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<DiscoveryResultDto>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Programs);
        Assert.NotEmpty(result.StudyTracks);
    }

    [Fact]
    public async Task Search_WithTrackFilter_FiltersProgramsByTrack()
    {
        EnsureUserAndProgramExist(302, "discovery302@test.com", out _);
        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/discovery?track=AI%20%26%20Robotics", 302, "discovery302@test.com");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<DiscoveryResultDto>();
        Assert.NotNull(result);
        Assert.All(result.Programs, p => Assert.Contains(p.Tags, t => t.Contains("AI & Robotics", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task GetProgram_ExistingId_ReturnsProgramDetails()
    {
        EnsureUserAndProgramExist(303, "discovery303@test.com", out var programId);
        var request = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/discovery/programs/{programId}", 303, "discovery303@test.com");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var program = await response.Content.ReadFromJsonAsync<DiscoveryProgramDto>();
        Assert.NotNull(program);
        Assert.Equal(programId, program.Id);
        Assert.Equal("MSc Informatics Test", program.Name);
        Assert.Equal("TU Munich", program.University);
        Assert.Equal("Munich", program.City);
        Assert.Equal("Germany", program.Country);
        Assert.Equal("High-ranking German CS master program.", program.Description);
        Assert.Equal("BSc in CS, English B2/C1.", program.Requirements);
        Assert.Equal("https://tum.de", program.OfficialLink);
    }

    [Fact]
    public async Task GetProgram_NonExistent_ReturnsNotFound()
    {
        EnsureUserAndProgramExist(304, "discovery304@test.com", out _);
        var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/discovery/programs/999999", 304, "discovery304@test.com");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
