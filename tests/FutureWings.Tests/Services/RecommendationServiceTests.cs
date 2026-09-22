using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Tests.Services;

public class RecommendationServiceTests
{
    private static FutureWings.Infrastructure.Data.FutureWingsDbContext CreateSeededContext()
    {
        var context = TestDbContextFactory.Create();

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
        using var context = CreateSeededContext();
        var service = new RecommendationService(context);

        var recommendations = await service.GetRecommendationsAsync(1);

        Assert.NotEmpty(recommendations);
        Assert.Equal("MSc Artificial Intelligence", recommendations[0].ProgramName);
        Assert.True(recommendations[0].MatchScore > recommendations[1].MatchScore);
        Assert.NotEmpty(recommendations[0].Reason);
    }
}
