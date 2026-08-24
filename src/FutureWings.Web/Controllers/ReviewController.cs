using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewController(IReviewService reviewService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(ReviewDto request)
    {
        await reviewService.AddReviewAsync(request);
        return Ok(new { Message = "Placeholder review accepted." });
    }

    [HttpGet("university/{universityId:int}")]
    public async Task<IActionResult> GetForUniversity(int universityId) =>
        Ok(await reviewService.GetUniversityReviewsAsync(universityId));
}
