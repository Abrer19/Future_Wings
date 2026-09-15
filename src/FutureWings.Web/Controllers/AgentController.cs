using FutureWings.Application.DTOs.Agent;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize(Roles = "Agent,Admin")]
[ApiController]
[Route("api/agent")]
public class AgentController(IAgentService agentService) : ControllerBase
{
    [HttpGet("countries")]
    public async Task<IActionResult> GetCountries() => Ok(await agentService.GetCountriesAsync());

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int? countryId) =>
        Ok(await agentService.GetCountryOverviewAsync(countryId));

    [HttpGet("applicants")]
    public async Task<IActionResult> GetApplicants([FromQuery] int? countryId, [FromQuery] string? status) =>
        Ok(await agentService.GetApplicantsAsync(countryId, status));

    [HttpPatch("applications/{applicationId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int applicationId, [FromBody] StatusUpdateRequest request)
    {
        var result = await agentService.UpdateApplicantStatusAsync(applicationId, request.Status);
        return result ? Ok(new { success = true }) : NotFound(new { message = "Application not found or invalid status." });
    }

    [HttpPost("programs")]
    public async Task<IActionResult> CreateProgram([FromBody] AgentCreateProgramDto dto)
    {
        var result = await agentService.CreateProgramAsync(dto);
        return result ? Ok(new { success = true }) : BadRequest(new { message = "University not found or invalid data." });
    }

    [HttpPost("scholarships")]
    public async Task<IActionResult> CreateScholarship([FromBody] AgentCreateScholarshipDto dto)
    {
        var result = await agentService.CreateScholarshipAsync(dto);
        return result ? Ok(new { success = true }) : BadRequest(new { message = "Country not found or invalid data." });
    }

    [HttpPost("universities")]
    public async Task<IActionResult> CreateUniversity([FromBody] AgentCreateUniversityDto dto)
    {
        var result = await agentService.CreateUniversityAsync(dto);
        return result ? Ok(new { success = true }) : BadRequest(new { message = "Country not found or invalid data." });
    }

    public sealed record StatusUpdateRequest(string Status);
}
