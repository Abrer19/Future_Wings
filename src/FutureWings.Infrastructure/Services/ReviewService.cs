using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public class ReviewService(FutureWingsDbContext context) : IReviewService
{
    public async Task AddReviewAsync(ReviewDto request)
    {
        var rating = new Rating
        {
            UserId = request.UserId,
            UniversityId = request.UniversityId,
            Score = Math.Clamp(request.Score, 1, 5),
            Comment = request.Comment
        };
        context.Ratings.Add(rating);
        await context.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId)
    {
        return await context.Ratings
            .AsNoTracking()
            .Where(r => r.UniversityId == universityId)
            .Select(r => new ReviewDto
            {
                UserId = r.UserId,
                UniversityId = r.UniversityId,
                Score = r.Score,
                Comment = r.Comment
            })
            .ToListAsync();
    }
}

