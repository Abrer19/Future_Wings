using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Application;

namespace FutureWings.Tests.Controllers;

public class ApplicationControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;

    public ApplicationControllerTests(FutureWingsWebFactory factory)
    {
        _client = factory.CreateClient();
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
        var token = FutureWingsWebFactory.GenerateTestToken(userId: 10, email: "student10@test.com");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/applications");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var list = await response.Content.ReadFromJsonAsync<List<ApplicationDetailsDto>>();
        Assert.NotNull(list);
    }
}
