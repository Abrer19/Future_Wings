using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class AdminService : IAdminService
{
    public Task<string> GetDashboardSummaryAsync() =>
        Task.FromResult("Placeholder admin dashboard summary.");
}
