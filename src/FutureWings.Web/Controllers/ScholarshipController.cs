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
        Ok(await scholarshipService.GetAllAsync(countryId, search));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ScholarshipDto>> GetById(int id)
    {
        var result = await scholarshipService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }
}
