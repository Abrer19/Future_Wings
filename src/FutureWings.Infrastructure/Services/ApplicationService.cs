using FutureWings.Application.DTOs.Application;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Returns a fixed placeholder status; never reads or writes the Applications table.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IApplicationService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
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
