using System.Security.Claims;
using FutureWings.Application.DTOs.Visa;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/visa")]
public sealed class VisaController(IVisaService visaService) : ControllerBase
{
    [HttpPost("evaluate")]
    public async Task<ActionResult<VisaRiskResultDto>> Evaluate(VisaAssessmentRequestDto request) =>
        Ok(await visaService.EvaluateRiskAsync(GetUserId(), request));

    [HttpGet("application/{applicationId:int}/risk")]
    public async Task<ActionResult<VisaRiskResultDto>> GetRisk(int applicationId)
    {
        var result = await visaService.GetRiskForApplicationAsync(GetUserId(), applicationId);
        return result is null ? NotFound() : Ok(result);
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
