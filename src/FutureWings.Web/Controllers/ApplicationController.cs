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
    public async Task<IActionResult> Get(int applicationId) =>
        Ok(await applicationService.GetAsync(GetUserId(), applicationId));

    [HttpPost]
    public async Task<IActionResult> Create(ApplicationCreateDto request)
    {
        var result = await applicationService.CreateAsync(GetUserId(), request);
        return CreatedAtAction(nameof(Get), new { applicationId = result.ApplicationId }, result);
    }

    [HttpPatch("{applicationId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int applicationId, ApplicationStatusUpdateDto request) =>
        Ok(await applicationService.UpdateStatusAsync(GetUserId(), applicationId, request));

    [HttpDelete("{applicationId:int}")]
    public async Task<IActionResult> Delete(int applicationId)
    {
        await applicationService.DeleteAsync(GetUserId(), applicationId);
        return NoContent();
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
