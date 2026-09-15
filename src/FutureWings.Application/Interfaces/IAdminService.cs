using FutureWings.Application.DTOs.Admin;

namespace FutureWings.Application.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<IReadOnlyList<AdminUserDto>> GetUsersAsync();
    Task<AdminUserDto?> SetUserRoleAsync(int actorUserId, int userId, string role);
    Task<AdminUserDto?> SetUserSubscriptionTierAsync(int userId, string tier);
    Task<IReadOnlyList<AdminApplicationDto>> GetAllApplicationsAsync();
    Task<bool> UpdateApplicationStatusAsync(int applicationId, string status);
    Task<AdminRevenueDto> GetRevenueOverviewAsync();
}

