using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Profile;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class ProfileControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public ProfileControllerTests(FutureWingsWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProfile_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/profile");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProfile_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PutAsJsonAsync("/api/profile", new UpdateProfileDto
        {
            FirstName = "Test",
            LastName = "User"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetProfile_WithValidToken_ReturnsProfile()
    {
        const int testUserId = 77;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            if (!context.Users.Any(u => u.Id == testUserId))
            {
                context.Users.Add(new User
                {
                    Id = testUserId,
                    Email = "profiletest@example.com",
                    Profile = new UserProfile
                    {
                        UserId = testUserId,
                        FirstName = "Jane",
                        LastName = "Doe",
                        Major = "Computer Science"
                    }
                });
                context.SaveChanges();
            }
        }

        var token = FutureWingsWebFactory.GenerateTestToken(userId: testUserId, email: "profiletest@example.com");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/profile");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var profile = await response.Content.ReadFromJsonAsync<ProfileDto>();
        Assert.NotNull(profile);
        Assert.Equal("Jane", profile.FirstName);
        Assert.Equal("Doe", profile.LastName);
    }
}
