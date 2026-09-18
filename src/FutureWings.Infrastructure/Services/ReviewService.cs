using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public class ReviewService(FutureWingsDbContext context) : IReviewService
{
    public async Task<ReviewDto> AddReviewAsync(int userId, ReviewCreateDto request)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId)) throw new KeyNotFoundException("User not found.");
        if (!await context.Universities.AnyAsync(university => university.Id == request.UniversityId))
            throw new KeyNotFoundException("University not found.");
        if (request.Score is < 1 or > 5) throw new ArgumentException("Score must be between 1 and 5.");

        var rating = new Rating
        {
            UserId = userId,
            UniversityId = request.UniversityId,
            Score = request.Score,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim()
        };
        context.Ratings.Add(rating);
        await context.SaveChangesAsync();

        return await QueryReviews(request.UniversityId, userId)
            .SingleAsync(review => review.Id == rating.Id);
    }

    public async Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId, int currentUserId)
    {
        if (!await context.Universities.AnyAsync(university => university.Id == universityId))
            throw new KeyNotFoundException("University not found.");

        return await QueryReviews(universityId, currentUserId)
            .OrderByDescending(review => review.IsMine)
            .ThenByDescending(review => review.Id)
            .ToListAsync();
    }

    private IQueryable<ReviewDto> QueryReviews(int universityId, int currentUserId) =>
        context.Ratings
            .AsNoTracking()
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .Include(r => r.University).ThenInclude(u => u.Country)
            .Where(r => r.UniversityId == universityId)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UniversityId = r.UniversityId,
                UniversityName = r.University.Name,
                CountryName = r.University.Country.Name,
                ReviewerName = r.User.Profile != null
                    ? (r.User.Profile.FirstName + " " + r.User.Profile.LastName).Trim()
                    : r.User.Email,
                Score = r.Score,
                Comment = r.Comment,
                IsMine = r.UserId == currentUserId
            });
}

