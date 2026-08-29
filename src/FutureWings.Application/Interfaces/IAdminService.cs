using FutureWings.Application.DTOs.Admin;

namespace FutureWings.Application.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<IReadOnlyList<AdminUserDto>> GetUsersAsync();
    Task<AdminUserDto?> SetUserRoleAsync(int actorUserId, int userId, string role);
}
