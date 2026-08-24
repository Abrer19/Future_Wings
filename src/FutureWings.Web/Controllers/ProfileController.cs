using FutureWings.Application.DTOs.Profile;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpGet("{userId:int}")]
    public async Task<IActionResult> Get(int userId) =>
        Ok(await profileService.GetProfileAsync(userId));

    [HttpPut("{userId:int}")]
    public async Task<IActionResult> Update(int userId, UpdateProfileDto request) =>
        Ok(await profileService.UpdateProfileAsync(userId, request));
}
