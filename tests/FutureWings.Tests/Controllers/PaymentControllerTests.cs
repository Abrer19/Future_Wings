using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class PaymentControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public PaymentControllerTests(FutureWingsWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateSubscription_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PostAsync("/api/payment/subscription?priceId=price_pro", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateSubscription_WithoutPriceId_ReturnsBadRequest()
    {
        var token = FutureWingsWebFactory.GenerateTestToken(userId: 1, email: "student1@test.com");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/payment/subscription?priceId=");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSubscription_InProduction_ReturnsServiceUnavailable()
    {
        // Custom factory running in Production environment
        using var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("ASPNETCORE_ENVIRONMENT", "Production");
        });

        using var prodClient = prodFactory.CreateClient();
        var token = FutureWingsWebFactory.GenerateTestToken(userId: 1, email: "student1@test.com");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/payment/subscription?priceId=price_pro");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await prodClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}
