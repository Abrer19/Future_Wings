using FutureWings.Application.DTOs.Review;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

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
    public async Task AddReviewAsync_WithHtmlAndScriptTags_SanitizesCommentAndStripsExecutableMarkup()
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
            Score = 5,
            Comment = "<script>alert(\"XSS\")</script><b>Helpful review</b>"
        });

        // Script block removed, bold tags stripped, clean readable plain text preserved
        Assert.Equal("Helpful review", result.Comment);

        // Database record must also be stored clean
        var stored = await context.Ratings.SingleAsync(r => r.Id == result.Id);
        Assert.Equal("Helpful review", stored.Comment);
    }

    [Fact]
    public async Task AddReviewAsync_WithOnlyScriptTag_SanitizesToNull()
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
            Score = 5,
            Comment = "<script>alert(1)</script>"
        });

        Assert.Null(result.Comment);
    }

    [Fact]
    public async Task GetUniversityReviewsAsync_SanitizesStoredReviewsWithHtml()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Universities.Add(new University { Id = 1, CountryId = 1, Name = "UofT", City = "Toronto" });
        context.Ratings.Add(new Rating
        {
            Id = 10,
            UserId = 1,
            UniversityId = 1,
            Score = 5,
            Comment = "<b>Top university</b> and <img src=x onerror=alert(1)>great labs."
        });
        context.SaveChanges();

        var service = new ReviewService(context);
        var reviews = await service.GetUniversityReviewsAsync(1, 1);

        Assert.Single(reviews);
        Assert.Equal("Top university and great labs.", reviews[0].Comment);
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
