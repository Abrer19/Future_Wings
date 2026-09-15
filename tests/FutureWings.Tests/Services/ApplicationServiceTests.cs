using FutureWings.Application.DTOs.Application;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using FutureWings.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using DomainApplication = FutureWings.Domain.Entities.Application;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Tests.Services;

public class ApplicationServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new FutureWingsDbContext(options);

        // Seed basic application states
        context.ApplicationStates.AddRange(
            new ApplicationState { Id = 1, Name = "Draft" },
            new ApplicationState { Id = 2, Name = "Submitted" },
            new ApplicationState { Id = 3, Name = "Under Review" },
            new ApplicationState { Id = 4, Name = "Accepted" },
            new ApplicationState { Id = 5, Name = "Rejected" },
            new ApplicationState { Id = 6, Name = "Withdrawn" }
        );

        // Seed country, university, and program
        var country = new Country { Id = 1, Name = "Canada", Code = "CA" };
        var university = new University { Id = 1, CountryId = 1, Name = "University of Toronto", City = "Toronto" };
        var program = new AcademicProgram
        {
            Id = 1,
            UniversityId = 1,
            Name = "MSc Computer Science",
            Level = "Master's",
            AnnualTuitionUsd = 32000,
            DurationMonths = 24
        };

        context.Users.AddRange(
            new User { Id = 10, Email = "student10@test.com" },
            new User { Id = 20, Email = "student20@test.com" }
        );
        context.Countries.Add(country);
        context.Universities.Add(university);
        context.Programs.Add(program);
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task CreateAsync_CreatesApplicationInDraftState()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ApplicationService(context);

        var result = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });

        Assert.NotNull(result);
        Assert.Equal("Draft", result.Status);
        Assert.True(result.ApplicationId > 0);

        var stored = await context.Applications.FindAsync(result.ApplicationId);
        Assert.NotNull(stored);
        Assert.Equal(10, stored.UserId);
        Assert.Equal(1, stored.ProgramId);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsApplicationsForSpecifiedUserOnly()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ApplicationService(context);

        await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });
        await service.CreateAsync(userId: 20, new ApplicationCreateDto { ProgramId = 1 });

        var user10Apps = await service.GetAllAsync(userId: 10);
        Assert.Single(user10Apps);
        Assert.Equal("MSc Computer Science", user10Apps[0].ProgramName);
        Assert.Equal("University of Toronto", user10Apps[0].UniversityName);
        Assert.Equal("Canada", user10Apps[0].Country);
        Assert.Equal("Draft", user10Apps[0].Status);

        var user20Apps = await service.GetAllAsync(userId: 20);
        Assert.Single(user20Apps);
    }

    [Fact]
    public async Task UpdateStatusAsync_UpdatesValidStatusForOwner()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });
        var updated = await service.UpdateStatusAsync(userId: 10, created.ApplicationId, new ApplicationStatusUpdateDto { Status = "Submitted" });

        Assert.NotNull(updated);
        Assert.Equal("Submitted", updated.Status);

        // Verify unauthorized user throws KeyNotFoundException
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateStatusAsync(userId: 99, created.ApplicationId, new ApplicationStatusUpdateDto { Status = "Accepted" }));
    }

    [Fact]
    public async Task DeleteAsync_DeletesApplicationForOwner()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });
        await service.DeleteAsync(userId: 10, created.ApplicationId);

        var apps = await service.GetAllAsync(userId: 10);
        Assert.Empty(apps);
    }
}

public class DeadlineServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new FutureWingsDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_AddsDeadlineAndReturnsDto()
    {
        using var context = CreateInMemoryDbContext();
        var service = new DeadlineService(context);

        var request = new FutureWings.Application.DTOs.Deadline.DeadlineCreateDto
        {
            Title = "Submit Transcript",
            Category = "Application",
            Notes = "Official sealed copy",
            DueAt = DateTimeOffset.UtcNow.AddDays(7)
        };

        var created = await service.CreateAsync(1, request);

        Assert.NotNull(created);
        Assert.Equal("Submit Transcript", created.Title);
        Assert.Equal("Application", created.Category);
        Assert.Null(created.CompletedAt);

        var list = await service.GetAllAsync(1);
        Assert.Single(list);
    }

    [Fact]
    public async Task SetCompletionAsync_TogglesCompletionStatus()
    {
        using var context = CreateInMemoryDbContext();
        var service = new DeadlineService(context);

        var created = await service.CreateAsync(1, new FutureWings.Application.DTOs.Deadline.DeadlineCreateDto
        {
            Title = "Pay Fee",
            Category = "Financial",
            DueAt = DateTimeOffset.UtcNow.AddDays(3)
        });

        var completed = await service.SetCompletionAsync(1, created.Id, true);
        Assert.NotNull(completed);
        Assert.NotNull(completed.CompletedAt);
        Assert.True(completed.IsCompleted);

        var uncompleted = await service.SetCompletionAsync(1, created.Id, false);
        Assert.NotNull(uncompleted);
        Assert.Null(uncompleted.CompletedAt);
        Assert.False(uncompleted.IsCompleted);
    }

    [Fact]
    public async Task DeleteAsync_RemovesOnlyTargetDeadline()
    {
        using var context = CreateInMemoryDbContext();
        var service = new DeadlineService(context);

        var d1 = await service.CreateAsync(1, new FutureWings.Application.DTOs.Deadline.DeadlineCreateDto { Title = "Task 1", Category = "General", DueAt = DateTimeOffset.UtcNow });
        var d2 = await service.CreateAsync(1, new FutureWings.Application.DTOs.Deadline.DeadlineCreateDto { Title = "Task 2", Category = "General", DueAt = DateTimeOffset.UtcNow });

        var deleted = await service.DeleteAsync(1, d1.Id);
        Assert.True(deleted);

        var remaining = await service.GetAllAsync(1);
        Assert.Single(remaining);
        Assert.Equal(d2.Id, remaining[0].Id);
    }
}

public class ProfileServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new FutureWingsDbContext(options);

        var user = new User
        {
            Id = 5,
            Email = "student@test.com",
            Profile = new UserProfile
            {
                Id = 5,
                UserId = 5,
                FirstName = "Alice",
                LastName = "Smith",
                Cgpa = 3.8m,
                Major = "Computer Science",
                BudgetUsd = 40000m,
                DegreeLevel = "Master's"
            }
        };

        context.Users.Add(user);
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task GetProfileAsync_ReturnsCorrectUserProfile()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ProfileService(context);

        var profile = await service.GetProfileAsync(5);

        Assert.NotNull(profile);
        Assert.Equal("Alice", profile.FirstName);
        Assert.Equal("Smith", profile.LastName);
        Assert.Equal(3.8m, profile.Cgpa);
        Assert.Equal("Computer Science", profile.Major);
        Assert.Equal(40000m, profile.BudgetUsd);
        Assert.Equal("Master's", profile.DegreeLevel);
    }

    [Fact]
    public async Task UpdateProfileAsync_UpdatesFieldsSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ProfileService(context);

        var updateRequest = new FutureWings.Application.DTOs.Profile.UpdateProfileDto
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
    }
}

public class RecommendationServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new FutureWingsDbContext(options);

        var country = new Country { Id = 1, Name = "United Kingdom", Code = "GB" };
        var university = new University { Id = 1, CountryId = 1, Name = "Oxford University", City = "Oxford" };

        var p1 = new AcademicProgram
        {
            Id = 1,
            UniversityId = 1,
            Name = "MSc Artificial Intelligence",
            Level = "Master's",
            AnnualTuitionUsd = 35000,
            DurationMonths = 12,
            MatchScore = 85,
            Tags = "AI, Data Science, Machine Learning"
        };

        var p2 = new AcademicProgram
        {
            Id = 2,
            UniversityId = 1,
            Name = "BSc History",
            Level = "Bachelor's",
            AnnualTuitionUsd = 25000,
            DurationMonths = 36,
            MatchScore = 70,
            Tags = "Humanities, History"
        };

        var user = new User
        {
            Id = 1,
            Email = "ai_student@test.com",
            Profile = new UserProfile
            {
                Id = 1,
                UserId = 1,
                FirstName = "David",
                LastName = "Lee",
                DegreeLevel = "Master's",
                Major = "Artificial Intelligence",
                Cgpa = 3.9m,
                BudgetUsd = 40000m
            }
        };

        context.Countries.Add(country);
        context.Universities.Add(university);
        context.Programs.AddRange(p1, p2);
        context.Users.Add(user);
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task GetRecommendationsAsync_RanksMatchingProgramHigher()
    {
        using var context = CreateInMemoryDbContext();
        var service = new RecommendationService(context);

        var recommendations = await service.GetRecommendationsAsync(1);

        Assert.NotEmpty(recommendations);
        Assert.Equal("MSc Artificial Intelligence", recommendations[0].ProgramName);
        Assert.True(recommendations[0].MatchScore > recommendations[1].MatchScore);
        Assert.NotEmpty(recommendations[0].Reason);
    }
}

public class DocumentServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new FutureWingsDbContext(options);
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task UploadAndListDocuments_WorksForUser()
    {
        using var context = CreateInMemoryDbContext();
        var service = new DocumentService(context);

        var doc = await service.UploadAsync(1, new FutureWings.Application.DTOs.Document.DocumentUploadDto
        {
            FileName = "passport.pdf",
            ContentType = "application/pdf",
            Content = [1, 2, 3, 4]
        });

        Assert.True(doc.Id > 0);

        var userDocs = await service.GetAllAsync(1);
        Assert.Single(userDocs);
        Assert.Equal("passport.pdf", userDocs[0].FileName);
    }

    [Fact]
    public async Task DeleteAsync_DeletesDocumentOwnedByUser()
    {
        using var context = CreateInMemoryDbContext();
        var service = new DocumentService(context);

        var doc = await service.UploadAsync(1, new FutureWings.Application.DTOs.Document.DocumentUploadDto
        {
            FileName = "ielts_score.pdf",
            ContentType = "application/pdf",
            Content = [10, 20, 30]
        });
        await service.DeleteAsync(1, doc.Id);

        var userDocs = await service.GetAllAsync(1);
        Assert.Empty(userDocs);
    }
}
