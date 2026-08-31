using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FutureWings.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class RecommendationController(IRecommendationService recommendationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetForCurrentUser()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var userId)
            ? Ok(await recommendationService.GetRecommendationsAsync(userId))
            : Unauthorized(new { message = "The authenticated user identifier is invalid." });
    }
}
