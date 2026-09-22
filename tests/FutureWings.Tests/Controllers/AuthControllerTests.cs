using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Auth;

namespace FutureWings.Tests.Controllers;

public class AuthControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(FutureWingsWebFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithValidToken_ReturnsUserClaims()
    {
        var token = FutureWingsWebFactory.GenerateTestToken(userId: 42, email: "student42@test.com", role: "Student");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.Equal("42", body["userId"]);
        Assert.Equal("student42@test.com", body["email"]);
        Assert.Equal("Student", body["role"]);
    }

    [Fact]
    public async Task Register_WithInvalidDto_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterDto
        {
            Email = "",
            Password = ""
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithNonExistentAccount_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginDto
        {
            Email = "nonexistent_999999@test.com",
            Password = "WrongPassword123!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
