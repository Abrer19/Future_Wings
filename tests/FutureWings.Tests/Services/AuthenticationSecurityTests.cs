using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FutureWings.Application.DTOs.Auth;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Tests.Services;

public class AuthenticationSecurityTests
{
    [Fact]
    public void GenerateToken_IncludesUserIdentityAndAdminRole()
    {
        var user = new User { Id = 42, Email = "admin@futurewings.test", Role = "Admin" };
        var token = new JwtTokenService().GenerateToken(
            user,
            "a-test-secret-that-is-longer-than-thirty-two-characters",
            "FutureWings.Tests",
            "FutureWings.Client",
            TimeSpan.FromMinutes(10));

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Contains(jwt.Claims, claim => claim.Type == ClaimTypes.NameIdentifier && claim.Value == "42");
        Assert.Contains(jwt.Claims, claim => claim.Type == ClaimTypes.Email && claim.Value == user.Email);
        Assert.Contains(jwt.Claims, claim => claim.Type == ClaimTypes.Role && claim.Value == "Admin");
    }

    [Fact]
    public void PasswordHasher_StoresAHashAndValidatesOnlyTheCorrectPassword()
    {
        var hasher = new PasswordHasherService();
        const string password = "StrongPass123!";

        var hash = hasher.HashPassword(password);

        Assert.NotEqual(password, hash);
        Assert.True(hasher.VerifyPassword(password, hash));
        Assert.False(hasher.VerifyPassword("incorrect-password", hash));
    }

    [Fact]
    public void NewUsers_DefaultToStudentRole()
    {
        var user = new User();

        Assert.Equal("Student", user.Role);
    }

    [Fact]
    public async Task RegisterAsync_FirstRegistrant_CannotBecomeAdmin_AlwaysStudent()
    {
        using var context = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "a-test-secret-that-is-longer-than-thirty-two-characters",
                ["Jwt:Issuer"] = "FutureWings.Tests",
                ["Jwt:Audience"] = "FutureWings.Client"
            })
            .Build();

        var authService = new AuthService(
            context,
            new PasswordHasherService(),
            new JwtTokenService(),
            config);

        // First public registration in an empty database
        var response = await authService.RegisterAsync(new RegisterDto
        {
            Email = "first_user@test.com",
            Password = "Password123!",
            FirstName = "First",
            LastName = "User"
        });

        Assert.Equal("Student", response.Role);

        // Verify stored user in database is also Student, never Admin
        var storedUser = context.Users.Single(u => u.Email == "first_user@test.com");
        Assert.Equal("Student", storedUser.Role);
    }
}
