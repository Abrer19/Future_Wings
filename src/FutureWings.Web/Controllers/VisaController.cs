using System.Security.Claims;
using FutureWings.Application.DTOs.Visa;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VisaController(IVisaService visaService) : ControllerBase
{
    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate(VisaAssessmentRequestDto request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        try { return Ok(await visaService.EvaluateRiskAsync(userId, request)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }

    [HttpGet("application/{applicationId:int}/risk")]
    public async Task<IActionResult> GetRisk(int applicationId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var result = await visaService.GetRiskForApplicationAsync(userId, applicationId);
        return result is null ? NotFound() : Ok(result);
    }

    private bool TryGetUserId(out int userId) =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId) && userId > 0;
}
