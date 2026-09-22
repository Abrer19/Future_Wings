using FutureWings.Application.DTOs.Deadline;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class DeadlineServiceTests
{
    [Fact]
    public async Task CreateAsync_AddsDeadlineAndReturnsDto()
    {
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);

        var request = new DeadlineCreateDto
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
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);

        var created = await service.CreateAsync(1, new DeadlineCreateDto
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
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);

        var d1 = await service.CreateAsync(1, new DeadlineCreateDto { Title = "Task 1", Category = "General", DueAt = DateTimeOffset.UtcNow });
        var d2 = await service.CreateAsync(1, new DeadlineCreateDto { Title = "Task 2", Category = "General", DueAt = DateTimeOffset.UtcNow });

        var deleted = await service.DeleteAsync(1, d1.Id);
        Assert.True(deleted);

        var remaining = await service.GetAllAsync(1);
        Assert.Single(remaining);
        Assert.Equal(d2.Id, remaining[0].Id);
    }
}
