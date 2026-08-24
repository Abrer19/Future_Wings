using FutureWings.Application.DTOs.Application;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class ApplicationService : IApplicationService
{
    public Task<ApplicationStatusDto> CreateAsync(int userId, ApplicationCreateDto request) =>
        Task.FromResult(CreatePlaceholderStatus(1, "Draft"));

    public Task<ApplicationStatusDto> GetStatusAsync(int applicationId) =>
        Task.FromResult(CreatePlaceholderStatus(applicationId, "Pending"));

    private static ApplicationStatusDto CreatePlaceholderStatus(int applicationId, string status) => new()
    {
        ApplicationId = applicationId,
        Status = status,
        UpdatedAt = DateTimeOffset.UtcNow
    };
}
