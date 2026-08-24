using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class ReviewService : IReviewService
{
    public Task AddReviewAsync(ReviewDto request) => Task.CompletedTask;

    public Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId)
    {
        IReadOnlyList<ReviewDto> reviews = [];
        return Task.FromResult(reviews);
    }
}
