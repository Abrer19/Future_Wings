using FutureWings.Application.DTOs.Auth;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class AuthService : IAuthService
{
    public Task<AuthResponseDto> RegisterAsync(RegisterDto request) =>
        Task.FromResult(CreatePlaceholderResponse(request.Email));

    public Task<AuthResponseDto> LoginAsync(LoginDto request) =>
        Task.FromResult(CreatePlaceholderResponse(request.Email));

    private static AuthResponseDto CreatePlaceholderResponse(string email) => new()
    {
        UserId = 1,
        Email = email,
        Token = "placeholder-token",
        ExpiresAt = DateTimeOffset.UtcNow.AddHours(1)
    };
}
