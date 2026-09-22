using FutureWings.Application.DTOs.Application;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

/// <summary>Tests that existing tests still pass when using the shared fixture.</summary>
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
}
