using FutureWings.Application.DTOs.Review;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class ReviewServiceTests
{
    [Fact]
    public async Task AddReviewAsync_StoresReviewAndReturnsDetails()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Universities.Add(new University { Id = 1, CountryId = 1, Name = "UofT", City = "Toronto" });
        context.SaveChanges();

        var service = new ReviewService(context);
        var result = await service.AddReviewAsync(1, new ReviewCreateDto
        {
            UniversityId = 1,
            Score = 4,
            Comment = "Great university!"
        });

        Assert.NotNull(result);
        Assert.Equal(4, result.Score);
        Assert.Equal("Great university!", result.Comment);
        Assert.True(result.IsMine);

        var reviews = await service.GetUniversityReviewsAsync(1, 1);
        Assert.Single(reviews);
        Assert.Equal(4, reviews[0].Score);
    }

    [Fact]
    public async Task AddReviewAsync_RejectsInvalidScore()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Universities.Add(new University { Id = 1, CountryId = 1, Name = "UofT", City = "Toronto" });
        context.SaveChanges();

        var service = new ReviewService(context);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddReviewAsync(1, new ReviewCreateDto { UniversityId = 1, Score = 6 }));

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddReviewAsync(1, new ReviewCreateDto { UniversityId = 1, Score = 0 }));
    }

    [Fact]
    public async Task GetUniversityReviewsAsync_ThrowsForNonExistentUniversity()
    {
        using var context = TestDbContextFactory.Create();
        var service = new ReviewService(context);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.GetUniversityReviewsAsync(999, 1));
    }
}
