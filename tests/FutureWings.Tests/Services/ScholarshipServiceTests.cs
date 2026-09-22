using FutureWings.Domain.Entities;
<<<<<<< HEAD
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class ScholarshipServiceTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsAllScholarships()
    {
        using var context = TestDbContextFactory.Create();
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Scholarships.AddRange(
            new Scholarship { Id = 1, CountryId = 1, Name = "Merit Award" },
            new Scholarship { Id = 2, CountryId = 1, Name = "Need-Based Grant" }
        );
        context.SaveChanges();

        var service = new ScholarshipService(context);
        var result = await service.GetAllAsync();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, s => s.Name == "Merit Award");
        Assert.Contains(result, s => s.Name == "Need-Based Grant");
        Assert.All(result, s => Assert.Equal(10000m, s.AwardAmount));
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmptyWhenNoScholarships()
    {
        using var context = TestDbContextFactory.Create();
        var service = new ScholarshipService(context);

        var result = await service.GetAllAsync();

        Assert.Empty(result);
=======
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
        Assert.Equal(25_000m, result.AwardAmount);
        Assert.Equal("Strong academic record", result.EligibilityCriteria);
        Assert.NotNull(result.Deadline);
    }

    [Fact]
    public async Task GetAll_FiltersByCountry()
    {
        await using var context = CreateContext(); Seed(context);
        var results = await new ScholarshipService(context).GetAllAsync(countryId: 2);
        Assert.All(results, item => Assert.Equal("Germany", item.CountryName));
        Assert.Single(results);
    }

    [Theory]
    [InlineData("maple", "Maple Award")]
    [InlineData("germany", "Berlin Scholars")]
    public async Task GetAll_SearchesNameAndCountryCaseInsensitively(string search, string expected)
    {
        await using var context = CreateContext(); Seed(context);
        var result = Assert.Single(await new ScholarshipService(context).GetAllAsync(search: search));
        Assert.Equal(expected, result.Name);
    }

    [Fact]
    public async Task GetById_ReturnsNullForMissingScholarship()
    {
        await using var context = CreateContext();
        Assert.Null(await new ScholarshipService(context).GetByIdAsync(404));
    }

    private static FutureWingsDbContext CreateContext() => new(
        new DbContextOptionsBuilder<FutureWingsDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static void Seed(FutureWingsDbContext context)
    {
        context.Countries.AddRange(new Country { Id = 1, Name = "Canada", Code = "CA" }, new Country { Id = 2, Name = "Germany", Code = "DE" });
        context.Scholarships.AddRange(
            new Scholarship { Id = 1, CountryId = 1, Name = "Maple Award", EligibilityCriteria = "Strong academic record", AwardAmount = 25_000m, Deadline = DateTimeOffset.UtcNow.AddMonths(2) },
            new Scholarship { Id = 2, CountryId = 2, Name = "Berlin Scholars", EligibilityCriteria = "International students", AwardAmount = 15_000m, Deadline = DateTimeOffset.UtcNow.AddMonths(3) });
        context.SaveChanges();
>>>>>>> 69dd190b0bbe9e1b599cb3fa6242e2df87a7cda8
    }
}
