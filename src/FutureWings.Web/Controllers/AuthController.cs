using FutureWings.Application.DTOs.Auth;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService, IHostEnvironment hostEnvironment) : ControllerBase
{
    [EnableRateLimiting("auth-policy")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto request)
    {
        try
        {
            return StatusCode(StatusCodes.Status201Created, await authService.RegisterAsync(request));
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        catch (DbUpdateException)
        {
            // The unique email index is the final guard for simultaneous registrations.
            return Conflict(new { message = "An account with this email already exists." });
        }
    }

    [EnableRateLimiting("auth-policy")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto request)
    {
        try
        {
            return Ok(await authService.LoginAsync(request));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(new { message = exception.Message });
        }
    }

    /// <summary>
    /// Explicit local development-only administrative bootstrapping mechanism.
    /// Strictly forbidden in Production.
    /// </summary>
    [HttpPost("bootstrap-admin")]
    public async Task<IActionResult> BootstrapAdmin(RegisterDto request)
    {
        if (hostEnvironment.IsProduction())
        {
            return NotFound();
        }

        try
        {
            return Ok(await authService.BootstrapAdminAsync(request));
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
        email = User.FindFirstValue(ClaimTypes.Email),
        role = User.FindFirstValue(ClaimTypes.Role)
    });
}
