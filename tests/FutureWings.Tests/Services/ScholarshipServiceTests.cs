using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using FutureWings.Infrastructure.Services;
using FutureWings.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Tests.Services;

public sealed class ScholarshipServiceTests
{
    [Fact]
    public void Controller_RequiresAuthentication() =>
        Assert.NotNull(Attribute.GetCustomAttribute(typeof(ScholarshipController), typeof(AuthorizeAttribute)));

    [Fact]
    public async Task GetAll_ProjectsPersistedDetailsAndCountry()
    {
        await using var context = CreateContext();
        Seed(context);
        var results = await new ScholarshipService(context).GetAllAsync();

        var result = Assert.Single(results, item => item.Name == "Maple Award");
        Assert.Equal("Canada", result.CountryName);
        Assert.Equal("CA", result.CountryCode);
        Assert.Equal(25_000m, result.AwardAmount);
        Assert.Equal("Strong academic record", result.EligibilityCriteria);
        Assert.NotNull(result.Deadline);
    }

    [Fact]
    public async Task GetAll_FiltersByCountry()
    {
        await using var context = CreateContext();
        Seed(context);
        var results = await new ScholarshipService(context).GetAllAsync(countryId: 2);
        Assert.All(results, item => Assert.Equal("Germany", item.CountryName));
        Assert.Single(results);
    }

    [Theory]
    [InlineData("maple", "Maple Award")]
    [InlineData("germany", "Berlin Scholars")]
    public async Task GetAll_SearchesNameAndCountryCaseInsensitively(string search, string expected)
    {
        await using var context = CreateContext();
        Seed(context);
        var result = Assert.Single(await new ScholarshipService(context).GetAllAsync(search: search));
        Assert.Equal(expected, result.Name);
    }

    [Fact]
    public async Task GetById_ReturnsNullForMissingScholarship()
    {
        await using var context = CreateContext();
        Assert.Null(await new ScholarshipService(context).GetByIdAsync(404));
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmptyWhenNoScholarships()
    {
        await using var context = CreateContext();
        var service = new ScholarshipService(context);
        var result = await service.GetAllAsync();
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetById_ReturnsAllDetailsAndHandlesOptionalFieldsSafely()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        // Scholarship 1 has complete details
        var detailed = await service.GetByIdAsync(1);
        Assert.NotNull(detailed);
        Assert.Equal("Maple Award", detailed.Name);
        Assert.Equal("Full funding for Canadian graduate study.", detailed.Description);
        Assert.Equal("Transcripts, references, IELTS 7.0+", detailed.RequiredDocuments);
        Assert.Equal("Master's", detailed.StudyLevel);
        Assert.Equal("Computer Science", detailed.FieldOfStudy);
        Assert.Equal("https://maple.ca", detailed.OfficialLink);
        Assert.False(detailed.IsInterested);
        Assert.Null(detailed.Interest);

        // Scholarship 2 has null optional fields
        var minimal = await service.GetByIdAsync(2);
        Assert.NotNull(minimal);
        Assert.Null(minimal.Description);
        Assert.Null(minimal.RequiredDocuments);
        Assert.Null(minimal.StudyLevel);
        Assert.Null(minimal.FieldOfStudy);
        Assert.Null(minimal.OfficialLink);
        Assert.False(minimal.IsInterested);
    }

    [Fact]
    public async Task SetInterest_CreatesChecklistSteps_TailoredToScholarshipRequirements()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        var interest = await service.SetInterestAsync(userId: 1, scholarshipId: 1);

        Assert.NotNull(interest);
        Assert.Equal(1, interest.UserId);
        Assert.Equal(1, interest.ScholarshipId);
        Assert.Equal(7, interest.Steps.Count);

        // Verifies actual scholarship criteria is reflected in the steps
        var eligibilityStep = interest.Steps.Single(s => s.StepKey == "eligibility");
        Assert.Contains("Strong academic record", eligibilityStep.Description);

        var academicStep = interest.Steps.Single(s => s.StepKey == "academic_docs");
        Assert.Contains("Master's", academicStep.Description);

        var submitStep = interest.Steps.Single(s => s.StepKey == "submit");
        Assert.Contains("https://maple.ca", submitStep.Description);
    }

    [Fact]
    public async Task SetInterest_IsIdempotent_DoesNotCreateDuplicateRecordsOrSteps()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        var first = await service.SetInterestAsync(userId: 1, scholarshipId: 1);
        var second = await service.SetInterestAsync(userId: 1, scholarshipId: 1);

        Assert.Equal(first.Id, second.Id);
        Assert.Equal(first.Steps.Count, second.Steps.Count);

        var totalInterests = await context.ScholarshipInterests.CountAsync(i => i.UserId == 1 && i.ScholarshipId == 1);
        Assert.Equal(1, totalInterests);
    }

    [Fact]
    public async Task UpdateChecklistStep_CanMarkCompleteAndRevert()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        var interest = await service.SetInterestAsync(userId: 1, scholarshipId: 1);
        var stepId = interest.Steps.First().Id;

        // Mark complete
        var completed = await service.UpdateChecklistStepAsync(userId: 1, scholarshipId: 1, stepId: stepId, isCompleted: true);
        Assert.True(completed.IsCompleted);
        Assert.NotNull(completed.CompletedAt);

        // Revert to incomplete
        var reverted = await service.UpdateChecklistStepAsync(userId: 1, scholarshipId: 1, stepId: stepId, isCompleted: false);
        Assert.False(reverted.IsCompleted);
        Assert.Null(reverted.CompletedAt);
    }

    [Fact]
    public async Task UpdateChecklistStep_EnforcesUserOwnershipIsolation()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        var interest = await service.SetInterestAsync(userId: 1, scholarshipId: 1);
        var stepId = interest.Steps.First().Id;

        // User 2 tries to modify User 1's checklist step
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateChecklistStepAsync(userId: 2, scholarshipId: 1, stepId: stepId, isCompleted: true));
    }

    [Fact]
    public async Task UpdateChecklistStep_RejectsMismatchedScholarshipId()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        var interest = await service.SetInterestAsync(userId: 1, scholarshipId: 1);
        var stepId = interest.Steps.First().Id;

        // Passed scholarshipId 2 for a step belonging to scholarship 1
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateChecklistStepAsync(userId: 1, scholarshipId: 2, stepId: stepId, isCompleted: true));
    }

    [Fact]
    public async Task GetById_ReflectsUserInterestAndChecklistProgress()
    {
        await using var context = CreateContext();
        Seed(context);
        var service = new ScholarshipService(context);

        await service.SetInterestAsync(userId: 1, scholarshipId: 1);
        var scholarship = await service.GetByIdAsync(1, currentUserId: 1);

        Assert.NotNull(scholarship);
        Assert.True(scholarship.IsInterested);
        Assert.NotNull(scholarship.Interest);
        Assert.Equal(7, scholarship.Interest.Steps.Count);
    }

    private static FutureWingsDbContext CreateContext() => new(
        new DbContextOptionsBuilder<FutureWingsDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static void Seed(FutureWingsDbContext context)
    {
        context.Users.AddRange(
            new User { Id = 1, Email = "student1@test.com" },
            new User { Id = 2, Email = "student2@test.com" });

        context.Countries.AddRange(
            new Country { Id = 1, Name = "Canada", Code = "CA" },
            new Country { Id = 2, Name = "Germany", Code = "DE" });

        context.Scholarships.AddRange(
            new Scholarship
            {
                Id = 1,
                CountryId = 1,
                Name = "Maple Award",
                Description = "Full funding for Canadian graduate study.",
                EligibilityCriteria = "Strong academic record",
                RequiredDocuments = "Transcripts, references, IELTS 7.0+",
                StudyLevel = "Master's",
                FieldOfStudy = "Computer Science",
                OfficialLink = "https://maple.ca",
                AwardAmount = 25_000m,
                Deadline = DateTimeOffset.UtcNow.AddMonths(2)
            },
            new Scholarship
            {
                Id = 2,
                CountryId = 2,
                Name = "Berlin Scholars",
                EligibilityCriteria = "International students",
                AwardAmount = 15_000m,
                Deadline = DateTimeOffset.UtcNow.AddMonths(3)
            });
        context.SaveChanges();
    }
}
