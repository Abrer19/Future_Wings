using FutureWings.Application.DTOs.Auth;

namespace FutureWings.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto request);
    Task<AuthResponseDto> LoginAsync(LoginDto request);
}
