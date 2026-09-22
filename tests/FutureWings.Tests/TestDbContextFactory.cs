using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Tests;

/// <summary>
/// Shared helper for creating pre-seeded in-memory database contexts.
/// Eliminates duplicated CreateInMemoryDbContext methods across test classes.
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>Creates an empty in-memory context with a unique database name.</summary>
    public static FutureWingsDbContext Create()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new FutureWingsDbContext(options);
    }

    /// <summary>Creates a context seeded with application states (Draft through Withdrawn).</summary>
    public static FutureWingsDbContext CreateWithApplicationStates()
    {
        var context = Create();
        context.ApplicationStates.AddRange(
            new ApplicationState { Id = 1, Name = "Draft" },
            new ApplicationState { Id = 2, Name = "Submitted" },
            new ApplicationState { Id = 3, Name = "Under Review" },
            new ApplicationState { Id = 4, Name = "Accepted" },
            new ApplicationState { Id = 5, Name = "Rejected" },
            new ApplicationState { Id = 6, Name = "Withdrawn" }
        );
        context.SaveChanges();
        return context;
    }

    /// <summary>
    /// Creates a fully seeded context with application states, a country,
    /// a university, a program, and two test users.
    /// </summary>
    public static FutureWingsDbContext CreateFullySeededed()
    {
        var context = CreateWithApplicationStates();

        var country = new Country { Id = 1, Name = "Canada", Code = "CA", Description = "Top study destination in North America." };
        var university = new University { Id = 1, CountryId = 1, Name = "University of Toronto", City = "Toronto" };
        var program = new AcademicProgram
        {
            Id = 1,
            UniversityId = 1,
            Name = "MSc Computer Science",
            Level = "Master's",
            AnnualTuitionUsd = 32000,
            DurationMonths = 24,
            Tags = "AI, STEM, Computer Science"
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

    /// <summary>Creates a context with a user that has a complete profile.</summary>
    public static FutureWingsDbContext CreateWithUserProfile(int userId = 5)
    {
        var context = Create();
        var user = new User
        {
            Id = userId,
            Email = $"student{userId}@test.com",
            Profile = new UserProfile
            {
                Id = userId,
                UserId = userId,
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
}
