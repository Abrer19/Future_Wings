using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScholarshipController(IScholarshipService scholarshipService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await scholarshipService.GetAllAsync());
}
