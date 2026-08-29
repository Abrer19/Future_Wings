using FutureWings.Application.DTOs.Deadline;

namespace FutureWings.Application.Interfaces;

public interface IDeadlineService
{
    Task<IReadOnlyList<DeadlineDto>> GetAllAsync(int userId);
    Task<DeadlineDto> CreateAsync(int userId, DeadlineCreateDto request);
    Task<DeadlineDto?> SetCompletionAsync(int userId, int deadlineId, bool completed);
    Task<bool> DeleteAsync(int userId, int deadlineId);
}
