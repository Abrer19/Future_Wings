using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;

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
}
