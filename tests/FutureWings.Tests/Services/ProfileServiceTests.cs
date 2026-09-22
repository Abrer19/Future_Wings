using FutureWings.Application.DTOs.Profile;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class ProfileServiceTests
{
    [Fact]
    public async Task GetProfileAsync_ReturnsCorrectUserProfile()
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
    }
}
