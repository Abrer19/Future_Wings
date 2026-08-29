using FutureWings.Application.DTOs.Auth;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Infrastructure.Services;

public sealed class AuthService(
    FutureWingsDbContext context,
    PasswordHasherService passwordHasher,
    JwtTokenService jwtTokenService,
    IConfiguration configuration) : IAuthService
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
    {
        var email = NormalizeEmail(request.Email);
        if (await context.Users.AnyAsync(user => user.Email == email))
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var isFirstUser = !await context.Users.AnyAsync();
        var user = new User
        {
            Email = email,
            PasswordHash = passwordHasher.HashPassword(request.Password),
            Role = isFirstUser ? "Admin" : "Student",
            Profile = new UserProfile
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim()
            }
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();
        return CreateResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto request)
    {
        var email = NormalizeEmail(request.Email);
        var user = await context.Users
            .Include(candidate => candidate.Profile)
            .SingleOrDefaultAsync(candidate => candidate.Email == email);

        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash) ||
            !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return CreateResponse(user);
    }

    private AuthResponseDto CreateResponse(User user)
    {
        var jwt = configuration.GetSection("Jwt");
        var secret = jwt["Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var issuer = jwt["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = jwt["Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
        var expiresAt = DateTimeOffset.UtcNow.Add(TokenLifetime);

        return new AuthResponseDto
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.Profile?.FirstName ?? string.Empty,
            LastName = user.Profile?.LastName ?? string.Empty,
            Role = user.Role,
            Token = jwtTokenService.GenerateToken(user, secret, issuer, audience, TokenLifetime),
            ExpiresAt = expiresAt
        };
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
