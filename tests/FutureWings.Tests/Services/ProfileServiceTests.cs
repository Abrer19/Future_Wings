using FutureWings.Application.DTOs.Profile;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class ProfileServiceTests
{
    [Fact]
    public async Task GetProfileAsync_ReturnsCorrectUserProfile_AndMarksComplete()
    {
        using var context = TestDbContextFactory.CreateWithUserProfile(5);
        var service = new ProfileService(context);

        var profile = await service.GetProfileAsync(5);

        Assert.NotNull(profile);
        Assert.Equal("Alice", profile.FirstName);
        Assert.Equal("Smith", profile.LastName);
        Assert.Equal(3.8m, profile.Cgpa);
        Assert.Equal("Computer Science", profile.Major);
        Assert.Equal(40000m, profile.BudgetUsd);
        Assert.Equal("Master's", profile.DegreeLevel);
        Assert.True(profile.IsAcademicComplete);
        Assert.Equal(4, profile.CompletedCoreFieldsCount);
        Assert.Equal(4, profile.TotalRequiredCoreFieldsCount);
        Assert.Empty(profile.MissingCoreFields);
        Assert.Equal(100, profile.CompletionPercentage);
    }

    [Fact]
    public async Task UpdateProfileAsync_UpdatesFieldsSuccessfully()
    {
        using var context = TestDbContextFactory.CreateWithUserProfile(5);
        var service = new ProfileService(context);

        var updateRequest = new UpdateProfileDto
        {
            FirstName = "Alicia",
            LastName = "Keys",
            Cgpa = 3.9m,
            Major = "Data Science",
            BudgetUsd = 45000m,
            DegreeLevel = "Master's"
        };

        var updated = await service.UpdateProfileAsync(5, updateRequest);

        Assert.Equal("Alicia", updated.FirstName);
        Assert.Equal("Keys", updated.LastName);
        Assert.Equal(3.9m, updated.Cgpa);
        Assert.Equal("Data Science", updated.Major);
        Assert.True(updated.IsAcademicComplete);
        Assert.Equal(4, updated.CompletedCoreFieldsCount);
    }

    [Fact]
    public async Task GetProfileAsync_WithIncompleteFields_CalculatesMissingFieldsCorrectly()
    {
        using var context = TestDbContextFactory.Create();
        var user = new User
        {
            Id = 99,
            Email = "incomplete@example.com",
            Profile = new UserProfile
            {
                Id = 99,
                UserId = 99,
                FirstName = "Bob",
                LastName = "Builder",
                Cgpa = 3.5m,
                Major = null, // Missing
                BudgetUsd = 0m, // 0 is invalid/incomplete
                DegreeLevel = "   " // Whitespace is incomplete
            }
        };
        context.Users.Add(user);
        context.SaveChanges();

        var service = new ProfileService(context);
        var profile = await service.GetProfileAsync(99);

        Assert.NotNull(profile);
        Assert.False(profile.IsAcademicComplete);
        Assert.Equal(1, profile.CompletedCoreFieldsCount);
        Assert.Equal(4, profile.TotalRequiredCoreFieldsCount);
        Assert.Equal(25, profile.CompletionPercentage);
        Assert.Contains("Target Major", profile.MissingCoreFields);
        Assert.Contains("Annual Budget", profile.MissingCoreFields);
        Assert.Contains("Target Degree Level", profile.MissingCoreFields);
        Assert.DoesNotContain("CGPA", profile.MissingCoreFields);
    }

    [Theory]
    [InlineData(-0.1, "CS", 10000, "Bachelor's", "CGPA")]
    [InlineData(4.1, "CS", 10000, "Bachelor's", "CGPA")]
    [InlineData(3.5, "", 10000, "Bachelor's", "Target Major")]
    [InlineData(3.5, "   ", 10000, "Bachelor's", "Target Major")]
    [InlineData(3.5, "CS", 0, "Bachelor's", "Annual Budget")]
    [InlineData(3.5, "CS", -500, "Bachelor's", "Annual Budget")]
    [InlineData(3.5, "CS", 10000, "", "Target Degree Level")]
    public void PopulateAcademicCompletion_CatchesSpecificInvalidField(
        double cgpa, string major, double budget, string degreeLevel, string expectedMissing)
    {
        var dto = new ProfileDto
        {
            Cgpa = (decimal)cgpa,
            Major = major,
            BudgetUsd = (decimal)budget,
            DegreeLevel = degreeLevel,
        };

        ProfileService.PopulateAcademicCompletion(dto);

        Assert.False(dto.IsAcademicComplete);
        Assert.Contains(expectedMissing, dto.MissingCoreFields);
    }
}
