using System.Security.Claims;
using FutureWings.Application.DTOs.Deadline;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/deadlines")]
public class DeadlineController(IDeadlineService deadlineService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await deadlineService.GetAllAsync(GetUserId()));

    [HttpPost]
    public async Task<IActionResult> Create(DeadlineCreateDto request)
    {
        var deadline = await deadlineService.CreateAsync(GetUserId(), request);
        return CreatedAtAction(nameof(GetAll), new { id = deadline.Id }, deadline);
    }

    [HttpPatch("{deadlineId:int}/completion")]
    public async Task<IActionResult> SetCompletion(int deadlineId, [FromBody] CompletionRequest request)
    {
        var deadline = await deadlineService.SetCompletionAsync(GetUserId(), deadlineId, request.Completed);
        return deadline is null ? NotFound() : Ok(deadline);
    }

    [HttpDelete("{deadlineId:int}")]
    public async Task<IActionResult> Delete(int deadlineId) =>
        await deadlineService.DeleteAsync(GetUserId(), deadlineId) ? NoContent() : NotFound();

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public sealed record CompletionRequest(bool Completed);
}
