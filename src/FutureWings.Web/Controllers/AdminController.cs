using System.Security.Claims;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() => Ok(await adminService.GetDashboardAsync());

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await adminService.GetUsersAsync());

    [HttpPatch("users/{userId:int}/role")]
    public async Task<IActionResult> SetUserRole(int userId, RoleRequest request)
    {
        try
        {
            var actorUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await adminService.SetUserRoleAsync(actorUserId, userId, request.Role);
            return user is null ? NotFound() : Ok(user);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPatch("users/{userId:int}/tier")]
    public async Task<IActionResult> SetUserTier(int userId, TierRequest request)
    {
        try
        {
            var user = await adminService.SetUserSubscriptionTierAsync(userId, request.Tier);
            return user is null ? NotFound() : Ok(user);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications() => Ok(await adminService.GetAllApplicationsAsync());

    [HttpPatch("applications/{applicationId:int}/status")]
    public async Task<IActionResult> UpdateApplicationStatus(int applicationId, ApplicationStatusRequest request)
    {
        var updated = await adminService.UpdateApplicationStatusAsync(applicationId, request.Status);
        return updated ? Ok(new { success = true }) : NotFound(new { message = "Application or status not found." });
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenue() => Ok(await adminService.GetRevenueOverviewAsync());

    public sealed record RoleRequest(string Role);
    public sealed record TierRequest(string Tier);
    public sealed record ApplicationStatusRequest(string Status);
}

