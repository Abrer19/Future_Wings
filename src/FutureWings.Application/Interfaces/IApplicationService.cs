using FutureWings.Application.DTOs.Application;

namespace FutureWings.Application.Interfaces;

public interface IApplicationService
{
    Task<ApplicationStatusDto> CreateAsync(int userId, ApplicationCreateDto request);
    Task<IReadOnlyList<ApplicationDetailsDto>> GetAllAsync(int userId);
    Task<ApplicationDetailsDto> GetAsync(int userId, int applicationId);
    Task<ApplicationStatusDto> UpdateStatusAsync(int userId, int applicationId, ApplicationStatusUpdateDto request);
    Task DeleteAsync(int userId, int applicationId);
}
