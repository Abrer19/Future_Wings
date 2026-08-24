using FutureWings.Application.DTOs.Application;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationController(IApplicationService applicationService) : ControllerBase
{
    [HttpPost("user/{userId:int}")]
    public async Task<IActionResult> Create(int userId, ApplicationCreateDto request) =>
        Ok(await applicationService.CreateAsync(userId, request));

    [HttpGet("{applicationId:int}/status")]
    public async Task<IActionResult> GetStatus(int applicationId) =>
        Ok(await applicationService.GetStatusAsync(applicationId));
}
