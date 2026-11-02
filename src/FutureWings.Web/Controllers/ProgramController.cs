using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProgramController(IDiscoveryService discoveryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string query = "") =>
        Ok((await discoveryService.SearchAsync(0, query, null, null, null)).Programs);

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var program = await discoveryService.GetProgramByIdAsync(0, id);
        return program is null ? NotFound(new { message = $"Program with ID {id} was not found." }) : Ok(program);
    }
}
