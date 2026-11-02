using System.ComponentModel.DataAnnotations;
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
    public async Task CreateAsync_WithNullDueAt_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);

        var request = new DeadlineCreateDto
        {
            Title = "Missing Due Date",
            Category = "Application",
            DueAt = null
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(1, request));
        Assert.Contains("valid due date", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_WithDefaultDueAt_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);

        var request = new DeadlineCreateDto
        {
            Title = "Default Due Date",
            Category = "Application",
            DueAt = default(DateTimeOffset)
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(1, request));
        Assert.Contains("valid due date", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_WithYear0001DueAt_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);

        var request = new DeadlineCreateDto
        {
            Title = "Year 0001 Due Date",
            Category = "Application",
            DueAt = new DateTimeOffset(1, 1, 1, 0, 0, 0, TimeSpan.Zero)
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(1, request));
        Assert.Contains("valid due date", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_WithValidUtcDueAt_PersistsExactInstant()
    {
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);
        var expectedDue = new DateTimeOffset(2026, 12, 1, 14, 0, 0, TimeSpan.Zero);

        var request = new DeadlineCreateDto
        {
            Title = "UTC Deadline",
            Category = "Exam",
            DueAt = expectedDue
        };

        var created = await service.CreateAsync(1, request);
        Assert.NotNull(created);
        Assert.Equal(expectedDue.ToUniversalTime(), created.DueAt.ToUniversalTime());
    }

    [Fact]
    public async Task CreateAsync_WithValidOffsetDueAt_PersistsAndPreservesInstant()
    {
        using var context = TestDbContextFactory.Create();
        var service = new DeadlineService(context);
        var offset = TimeSpan.FromHours(6);
        var expectedDue = new DateTimeOffset(2026, 12, 1, 20, 0, 0, offset);

        var request = new DeadlineCreateDto
        {
            Title = "Offset Deadline",
            Category = "Exam",
            DueAt = expectedDue
        };

        var created = await service.CreateAsync(1, request);
        Assert.NotNull(created);
        Assert.Equal(expectedDue.ToUniversalTime(), created.DueAt.ToUniversalTime());
        Assert.Equal(offset, created.DueAt.Offset);
    }

    [Fact]
    public void DeadlineCreateDto_Validation_RejectsYear0001()
    {
        var dto = new DeadlineCreateDto
        {
            Title = "Year 0001 Task",
            Category = "General",
            DueAt = new DateTimeOffset(1, 1, 1, 0, 0, 0, TimeSpan.Zero)
        };

        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, context, results, validateAllProperties: true);

        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage != null && r.ErrorMessage.Contains("valid due date"));
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
