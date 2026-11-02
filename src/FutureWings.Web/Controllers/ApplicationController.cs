using System.Security.Claims;
using FutureWings.Application.DTOs.Application;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/applications")]
public class ApplicationController(IApplicationService applicationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await applicationService.GetAllAsync(GetUserId()));

    [HttpGet("{applicationId:int}")]
    public async Task<IActionResult> Get(int applicationId)
    {
        try
        {
            return Ok(await applicationService.GetAsync(GetUserId(), applicationId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(ApplicationCreateDto request)
    {
        try
        {
            var result = await applicationService.CreateAsync(GetUserId(), request);
            return CreatedAtAction(nameof(Get), new { applicationId = result.ApplicationId }, result);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPatch("{applicationId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int applicationId, ApplicationStatusUpdateDto request)
    {
        try
        {
            return Ok(await applicationService.UpdateStatusAsync(GetUserId(), applicationId, request));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("{applicationId:int}")]
    public async Task<IActionResult> Delete(int applicationId)
    {
        try
        {
            await applicationService.DeleteAsync(GetUserId(), applicationId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
