using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Tests.Services;

public class DiscoveryServiceTests
{
    private static FutureWings.Infrastructure.Data.FutureWingsDbContext CreateSeededContext()
    {
        var context = TestDbContextFactory.Create();

        var ca = new Country { Id = 1, Name = "Canada", Code = "CA", IsFeatured = true };
        var uk = new Country { Id = 2, Name = "United Kingdom", Code = "GB", IsFeatured = false };
        context.Countries.AddRange(ca, uk);

        var uoft = new University { Id = 1, CountryId = 1, Name = "University of Toronto", City = "Toronto" };
        var oxford = new University { Id = 2, CountryId = 2, Name = "Oxford University", City = "Oxford" };
        context.Universities.AddRange(uoft, oxford);

        context.Programs.AddRange(
            new AcademicProgram { Id = 1, UniversityId = 1, Name = "MSc Computer Science", Level = "Master's", AnnualTuitionUsd = 32000, DurationMonths = 24, MatchScore = 90, Tags = "AI, STEM" },
            new AcademicProgram { Id = 2, UniversityId = 2, Name = "BA History", Level = "Bachelor's", AnnualTuitionUsd = 25000, DurationMonths = 36, MatchScore = 60, Tags = "Humanities" }
        );

        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task SearchAsync_ReturnsAllProgramsWhenNoFilters()
    {
        using var context = CreateSeededContext();
        var service = new DiscoveryService(context);

        var result = await service.SearchAsync(1, null, null, null);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Programs.Count);
        Assert.NotEmpty(result.Countries);
        Assert.NotEmpty(result.Levels);
    }

    [Fact]
    public async Task SearchAsync_FiltersByCountry()
    {
        using var context = CreateSeededContext();
        var service = new DiscoveryService(context);

        var result = await service.SearchAsync(1, null, "Canada", null);

        Assert.Single(result.Programs);
        Assert.Equal("MSc Computer Science", result.Programs[0].Name);
    }

    [Fact]
    public async Task SearchAsync_FiltersByLevel()
    {
        using var context = CreateSeededContext();
        var service = new DiscoveryService(context);

        var result = await service.SearchAsync(1, null, null, "Bachelor's");

        Assert.Single(result.Programs);
        Assert.Equal("BA History", result.Programs[0].Name);
    }

    [Fact]
    public async Task SearchAsync_FiltersByQuery()
    {
        using var context = CreateSeededContext();
        var service = new DiscoveryService(context);

        var result = await service.SearchAsync(1, "Computer", null, null);

        Assert.Single(result.Programs);
        Assert.Equal("MSc Computer Science", result.Programs[0].Name);
    }

    [Fact]
    public async Task SaveAndRemoveProgram_WorksCorrectly()
    {
        using var context = CreateSeededContext();
        var service = new DiscoveryService(context);

        var saved = await service.SaveProgramAsync(1, 1);
        Assert.True(saved);

        var savedPrograms = await service.GetSavedProgramsAsync(1);
        Assert.Single(savedPrograms);

        var removed = await service.RemoveSavedProgramAsync(1, 1);
        Assert.True(removed);

        savedPrograms = await service.GetSavedProgramsAsync(1);
        Assert.Empty(savedPrograms);
    }

    [Fact]
    public async Task GetCountriesAsync_ReturnsAllCountries()
    {
        using var context = CreateSeededContext();
        var service = new DiscoveryService(context);

        var countries = await service.GetCountriesAsync();

        Assert.Equal(2, countries.Count);
    }
}
