using FutureWings.Application.DTOs.Review;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class ReviewServiceTests
{
    [Fact]
    public async Task AddReviewAsync_StoresReviewWithClampedScore()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Universities.Add(new University { Id = 1, CountryId = 1, Name = "UofT", City = "Toronto" });
        context.SaveChanges();

        var service = new ReviewService(context);
        await service.AddReviewAsync(new ReviewDto
        {
            UserId = 1,
            UniversityId = 1,
            Score = 4,
            Comment = "Great university!"
        });

        var reviews = await service.GetUniversityReviewsAsync(1);
        Assert.Single(reviews);
        Assert.Equal(4, reviews[0].Score);
        Assert.Equal("Great university!", reviews[0].Comment);
    }

    [Fact]
    public async Task AddReviewAsync_ClampsScoreToValidRange()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Universities.Add(new University { Id = 1, CountryId = 1, Name = "UofT", City = "Toronto" });
        context.SaveChanges();

        var service = new ReviewService(context);

        await service.AddReviewAsync(new ReviewDto { UserId = 1, UniversityId = 1, Score = 10, Comment = "Too high" });
        await service.AddReviewAsync(new ReviewDto { UserId = 1, UniversityId = 1, Score = -1, Comment = "Too low" });

        var reviews = await service.GetUniversityReviewsAsync(1);
        Assert.Equal(2, reviews.Count);
        Assert.Equal(5, reviews[0].Score);  // Clamped from 10
        Assert.Equal(1, reviews[1].Score);  // Clamped from -1
    }

    [Fact]
    public async Task GetUniversityReviewsAsync_ReturnsEmptyForUnreviewedUniversity()
    {
        using var context = TestDbContextFactory.Create();
        var service = new ReviewService(context);

        var reviews = await service.GetUniversityReviewsAsync(999);

        Assert.Empty(reviews);
    }
}
