using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReviewController(IReviewService reviewService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(ReviewCreateDto request)
    {
        try
        {
            return Ok(await reviewService.AddReviewAsync(GetUserId(), request));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("university/{universityId:int}")]
    public async Task<IActionResult> GetForUniversity(int universityId)
    {
        try
        {
            return Ok(await reviewService.GetUniversityReviewsAsync(universityId, GetUserId()));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
