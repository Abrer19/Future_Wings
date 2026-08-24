using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VisaController(IVisaService visaService) : ControllerBase
{
    [HttpGet("application/{applicationId:int}/risk")]
    public async Task<IActionResult> GetRisk(int applicationId) =>
        Ok(await visaService.GetRiskAsync(applicationId));
}
