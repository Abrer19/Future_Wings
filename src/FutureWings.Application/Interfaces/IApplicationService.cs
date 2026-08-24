using FutureWings.Application.DTOs.Application;

namespace FutureWings.Application.Interfaces;

public interface IApplicationService
{
    Task<ApplicationStatusDto> CreateAsync(int userId, ApplicationCreateDto request);
    Task<ApplicationStatusDto> GetStatusAsync(int applicationId);
}
