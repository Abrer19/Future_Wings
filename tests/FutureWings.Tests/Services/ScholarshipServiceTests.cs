using FutureWings.Domain.Entities;
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
    }
}
