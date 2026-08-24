using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CountryController(IDiscoveryService discoveryService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        _ = discoveryService;
        return Ok(new[] { new { Id = 1, Name = "Placeholder Country" } });
    }
}
