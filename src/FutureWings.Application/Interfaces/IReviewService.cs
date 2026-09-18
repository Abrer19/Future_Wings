using FutureWings.Application.DTOs.Review;

namespace FutureWings.Application.Interfaces;

public interface IReviewService
{
    Task<ReviewDto> AddReviewAsync(int userId, ReviewCreateDto request);
    Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId, int currentUserId);
}
