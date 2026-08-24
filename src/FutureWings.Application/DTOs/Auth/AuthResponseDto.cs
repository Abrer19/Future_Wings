namespace FutureWings.Application.DTOs.Auth;

public class AuthResponseDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
}
