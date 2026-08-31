using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Add is a no-op and reads return empty; the Ratings table is never touched.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IReviewService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
public class ReviewService : IReviewService
{
    public Task AddReviewAsync(ReviewDto request) => Task.CompletedTask;

    public Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId)
    {
        IReadOnlyList<ReviewDto> reviews = [];
        return Task.FromResult(reviews);
    }
}
