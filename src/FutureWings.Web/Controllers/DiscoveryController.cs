using System.Security.Claims;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DiscoveryController(IDiscoveryService discoveryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? query,
        [FromQuery] string? country,
        [FromQuery] string? level,
        [FromQuery] string? track)
    {
        return Ok(await discoveryService.SearchAsync(GetUserId(), query, country, level, track));
    }

    [HttpGet("programs/{id:int}")]
    public async Task<IActionResult> GetProgram(int id)
    {
        var program = await discoveryService.GetProgramByIdAsync(GetUserId(), id);
        return program is null
            ? NotFound(new { message = $"Program with ID {id} was not found." })
            : Ok(program);
    }

    [HttpGet("saved")]
    public async Task<IActionResult> GetSaved() =>
        Ok(await discoveryService.GetSavedProgramsAsync(GetUserId()));

    [HttpPut("saved/{programId:int}")]
    public async Task<IActionResult> Save(int programId) =>
        await discoveryService.SaveProgramAsync(GetUserId(), programId)
            ? NoContent()
            : NotFound(new { message = "Program not found." });

    [HttpDelete("saved/{programId:int}")]
    public async Task<IActionResult> RemoveSaved(int programId) =>
        await discoveryService.RemoveSavedProgramAsync(GetUserId(), programId)
            ? NoContent()
            : NotFound(new { message = "Saved program not found." });

    private int GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("The authenticated user identifier is invalid.");
    }
}
