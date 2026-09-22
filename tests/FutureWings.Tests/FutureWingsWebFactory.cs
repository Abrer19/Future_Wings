using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FutureWings.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace FutureWings.Tests;

/// <summary>
/// Custom WebApplicationFactory that replaces SQL Server with InMemory
/// and configures JWT for testing.
/// </summary>
public class FutureWingsWebFactory : WebApplicationFactory<Program>
{
    public const string TestJwtSecret = "a-test-secret-that-is-way-longer-than-thirty-two-characters-for-hmac";
    public const string TestIssuer = "FutureWings";
    public const string TestAudience = "FutureWings.Client";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:Secret", TestJwtSecret);
        builder.UseSetting("Jwt:Issuer", TestIssuer);
        builder.UseSetting("Jwt:Audience", TestAudience);

        builder.ConfigureServices(services =>
        {
            // Replace SQL Server with InMemory
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FutureWingsDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            services.AddDbContext<FutureWingsDbContext>(options =>
                options.UseInMemoryDatabase("IntegrationTests_" + Guid.NewGuid()));
        });

        builder.UseEnvironment("Development");
    }

    /// <summary>Generates a valid JWT for the given user id, email, and role.</summary>
    public static string GenerateTestToken(int userId = 1, string email = "test@test.com", string role = "Student")
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: TestIssuer,
            audience: TestAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
