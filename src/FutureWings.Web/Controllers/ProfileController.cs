using System.Security.Claims;
using FutureWings.Application.DTOs.Profile;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

/// <summary>
/// The signed-in student's own profile.
///
/// SECURITY: this controller previously had no <c>[Authorize]</c> and took the user id
/// from the route (<c>/api/profile/{userId}</c>), so anyone could read or overwrite any
/// profile without a token. Both routes are now id-free and the user is resolved from
/// the JWT claim, which removes the ability to address another user's profile at all.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            return Ok(await profileService.GetProfileAsync(GetUserId()));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileDto request)
    {
        try
        {
            return Ok(await profileService.UpdateProfileAsync(GetUserId(), request));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private int GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("The authenticated user identifier is invalid.");
    }
}
