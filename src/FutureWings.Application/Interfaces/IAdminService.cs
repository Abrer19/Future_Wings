namespace FutureWings.Application.Interfaces;

public interface IAdminService
{
    Task<string> GetDashboardSummaryAsync();
}
