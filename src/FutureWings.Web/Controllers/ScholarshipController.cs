using System.Security.Claims;
using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/scholarship")]
public sealed class ScholarshipController(IScholarshipService scholarshipService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ScholarshipDto>>> GetAll(
        [FromQuery] int? countryId = null, [FromQuery] string? search = null) =>
        Ok(await scholarshipService.GetAllAsync(countryId, search, TryGetUserId()));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ScholarshipDto>> GetById(int id)
    {
        var result = await scholarshipService.GetByIdAsync(id, TryGetUserId());
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:int}/interest")]
    public async Task<ActionResult<ScholarshipInterestDto>> ExpressInterest(int id)
    {
        try
        {
            var interest = await scholarshipService.SetInterestAsync(GetUserId(), id);
            return Ok(interest);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:int}/process")]
    public async Task<ActionResult<ScholarshipInterestDto>> GetProcess(int id)
    {
        var result = await scholarshipService.GetProcessAsync(GetUserId(), id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:int}/checklist/{stepId:int}")]
    public async Task<ActionResult<ScholarshipChecklistStepDto>> UpdateChecklistStep(
        int id, int stepId, [FromBody] UpdateChecklistStepDto request)
    {
        try
        {
            var updated = await scholarshipService.UpdateChecklistStepAsync(
                GetUserId(), id, stepId, request.IsCompleted);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private int GetUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) && userId > 0
            ? userId
            : throw new UnauthorizedAccessException("The authenticated user identifier is invalid.");

    private int? TryGetUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) && userId > 0
            ? userId
            : null;
}
