using FutureWings.Application.DTOs.Application;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class ApplicationServiceTests
{
    [Fact]
    public async Task CreateAsync_CreatesApplicationInDraftState()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
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
        using var context = TestDbContextFactory.CreateFullySeededed();
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
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });
        var updated = await service.UpdateStatusAsync(userId: 10, created.ApplicationId, new ApplicationStatusUpdateDto { Status = "Submitted" });

        Assert.NotNull(updated);
        Assert.Equal("Submitted", updated.Status);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateStatusAsync(userId: 99, created.ApplicationId, new ApplicationStatusUpdateDto { Status = "Accepted" }));
    }

    [Fact]
    public async Task DeleteAsync_DeletesApplicationForOwner()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });
        await service.DeleteAsync(userId: 10, created.ApplicationId);

        var apps = await service.GetAllAsync(userId: 10);
        Assert.Empty(apps);
    }
}
