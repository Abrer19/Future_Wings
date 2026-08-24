using FutureWings.Application.DTOs.Auth;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto request) =>
        Ok(await authService.RegisterAsync(request));

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto request) =>
        Ok(await authService.LoginAsync(request));
}
