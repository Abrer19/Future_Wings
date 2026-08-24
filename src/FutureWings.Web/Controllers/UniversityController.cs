using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UniversityController(IDiscoveryService discoveryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string query = "") =>
        Ok(await discoveryService.SearchUniversitiesAsync(query));
}
