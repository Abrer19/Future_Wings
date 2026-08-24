using FutureWings.Application.DTOs.Review;

namespace FutureWings.Application.Interfaces;

public interface IReviewService
{
    Task AddReviewAsync(ReviewDto request);
    Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId);
}
