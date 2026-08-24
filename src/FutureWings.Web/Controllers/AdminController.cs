using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() =>
        Ok(new { Summary = await adminService.GetDashboardSummaryAsync() });
}
