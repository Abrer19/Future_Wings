using FutureWings.Application.DTOs.Application;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

/// <summary>Tests for application service error handling and edge cases.</summary>
public class ApplicationServiceRefactoredTests
{
    [Fact]
    public async Task CreateAsync_DuplicateProgram_ThrowsInvalidOperationException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 }));
    }

    [Fact]
    public async Task CreateAsync_NonExistentUser_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(userId: 999, new ApplicationCreateDto { ProgramId = 1 }));
    }

    [Fact]
    public async Task CreateAsync_NonExistentProgram_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 99999 }));

        Assert.Contains("Program not found", ex.Message);
    }

    [Fact]
    public async Task GetAsync_ReturnsCorrectApplicationDetail()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });
        var detail = await service.GetAsync(userId: 10, created.ApplicationId);

        Assert.NotNull(detail);
        Assert.Equal("MSc Computer Science", detail.ProgramName);
        Assert.Equal("Draft", detail.Status);
    }

    [Fact]
    public async Task GetAsync_UnknownId_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.GetAsync(userId: 10, applicationId: 99999));
    }

    [Fact]
    public async Task GetAsync_CrossUser_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });

        // User 20 attempts to access User 10's application
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.GetAsync(userId: 20, applicationId: created.ApplicationId));
    }

    [Fact]
    public async Task UpdateStatusAsync_UnknownId_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateStatusAsync(userId: 10, applicationId: 99999, new ApplicationStatusUpdateDto { Status = "Submitted" }));
    }

    [Fact]
    public async Task UpdateStatusAsync_CrossUser_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });

        // User 20 attempts to update User 10's application
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateStatusAsync(userId: 20, created.ApplicationId, new ApplicationStatusUpdateDto { Status = "Submitted" }));
    }

    [Fact]
    public async Task UpdateStatusAsync_InvalidStatus_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.CreateFullySeededed();
        var service = new ApplicationService(context);

        var created = await service.CreateAsync(userId: 10, new ApplicationCreateDto { ProgramId = 1 });

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateStatusAsync(userId: 10, created.ApplicationId, new ApplicationStatusUpdateDto { Status = "InvalidStatusName" }));

        Assert.Contains("Unknown application status", ex.Message);
    }
}
