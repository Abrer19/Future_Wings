using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationController(IRecommendationService recommendationService) : ControllerBase
{
    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetForUser(int userId) =>
        Ok(await recommendationService.GetRecommendationsAsync(userId));
}
