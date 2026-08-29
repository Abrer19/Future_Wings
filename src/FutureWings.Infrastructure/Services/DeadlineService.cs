using FutureWings.Application.DTOs.Deadline;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using DeadlineEntity = FutureWings.Domain.Entities.Deadline;

namespace FutureWings.Infrastructure.Services;

public sealed class DeadlineService(FutureWingsDbContext context) : IDeadlineService
{
    public async Task<IReadOnlyList<DeadlineDto>> GetAllAsync(int userId) =>
        await context.Deadlines
            .AsNoTracking()
            .Where(deadline => deadline.UserId == userId)
            .OrderBy(deadline => deadline.CompletedAt.HasValue)
            .ThenBy(deadline => deadline.DueAt)
            .Select(deadline => Map(deadline))
            .ToListAsync();

    public async Task<DeadlineDto> CreateAsync(int userId, DeadlineCreateDto request)
    {
        var deadline = new DeadlineEntity
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Category = request.Category.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            DueAt = request.DueAt,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.Deadlines.Add(deadline);
        await context.SaveChangesAsync();
        return Map(deadline);
    }

    public async Task<DeadlineDto?> SetCompletionAsync(int userId, int deadlineId, bool completed)
    {
        var deadline = await context.Deadlines.SingleOrDefaultAsync(item => item.Id == deadlineId && item.UserId == userId);
        if (deadline is null) return null;

        deadline.CompletedAt = completed ? DateTimeOffset.UtcNow : null;
        await context.SaveChangesAsync();
        return Map(deadline);
    }

    public async Task<bool> DeleteAsync(int userId, int deadlineId)
    {
        var deleted = await context.Deadlines
            .Where(deadline => deadline.Id == deadlineId && deadline.UserId == userId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }

    private static DeadlineDto Map(DeadlineEntity deadline) => new()
    {
        Id = deadline.Id,
        Title = deadline.Title,
        Category = deadline.Category,
        Notes = deadline.Notes,
        DueAt = deadline.DueAt,
        CreatedAt = deadline.CreatedAt,
        CompletedAt = deadline.CompletedAt
    };
}
