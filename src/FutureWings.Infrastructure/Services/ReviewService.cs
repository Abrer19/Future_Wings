using System.Text.RegularExpressions;
using FutureWings.Application.DTOs.Review;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public class ReviewService(FutureWingsDbContext context) : IReviewService
{
    /// <summary>
    /// Sanitizes review comments to plain text, stripping executable markup (<script>, <style>, <iframe`, etc.),
    /// stripping HTML tags while preserving inner readable text, and normalizing line breaks.
    /// </summary>
    public static string? SanitizeComment(string? comment)
    {
        if (string.IsNullOrWhiteSpace(comment)) return null;

        // 1. Strip dangerous blocks including their inner contents
        var text = Regex.Replace(
            comment,
            @"<(script|style|iframe|svg|object)\b[^>]*>[\s\S]*?(<\/\1>|$)",
            "",
            RegexOptions.IgnoreCase);

        // 2. Convert line break and paragraph tags to newlines
        text = Regex.Replace(text, @"<br\s*\/?>", "\n", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"<\/(p|div)>", "\n", RegexOptions.IgnoreCase);

        // 3. Strip all remaining HTML tags (e.g. <b>, </b>, <img>, etc.)
        text = Regex.Replace(text, @"<[a-zA-Z/!?][^>]*>", "");

        // 4. Decode common safe entities
        text = text
            .Replace("&amp;", "&")
            .Replace("&quot;", "\"")
            .Replace("&#39;", "'")
            .Replace("&apos;", "'")
            .Replace("&nbsp;", " ");

        text = text.Trim();
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

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
            Comment = SanitizeComment(request.Comment)
        };
        context.Ratings.Add(rating);
        await context.SaveChangesAsync();

        var created = await QueryReviews(request.UniversityId, userId)
            .SingleAsync(review => review.Id == rating.Id);
        created.Comment = SanitizeComment(created.Comment);
        return created;
    }

    public async Task<IReadOnlyList<ReviewDto>> GetUniversityReviewsAsync(int universityId, int currentUserId)
    {
        if (!await context.Universities.AnyAsync(university => university.Id == universityId))
            throw new KeyNotFoundException("University not found.");

        var reviews = await QueryReviews(universityId, currentUserId)
            .OrderByDescending(review => review.IsMine)
            .ThenByDescending(review => review.Id)
            .ToListAsync();

        foreach (var review in reviews)
        {
            review.Comment = SanitizeComment(review.Comment);
        }

        return reviews;
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
