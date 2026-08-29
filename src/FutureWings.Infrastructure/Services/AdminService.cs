using FutureWings.Application.DTOs.Admin;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class AdminService(FutureWingsDbContext context) : IAdminService
{
    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var now = DateTimeOffset.UtcNow;
        return new AdminDashboardDto
        {
            TotalUsers = await context.Users.CountAsync(),
            AdminUsers = await context.Users.CountAsync(user => user.Role == "Admin"),
            TotalApplications = await context.Applications.CountAsync(),
            ActiveDeadlines = await context.Deadlines.CountAsync(deadline => deadline.CompletedAt == null),
            OverdueDeadlines = await context.Deadlines.CountAsync(deadline => deadline.CompletedAt == null && deadline.DueAt < now),
            CompletedDeadlines = await context.Deadlines.CountAsync(deadline => deadline.CompletedAt != null),
            RecentApplications = await context.Applications
                .AsNoTracking()
                .OrderByDescending(application => application.SubmittedAt)
                .Take(8)
                .Select(application => new AdminApplicationDto
                {
                    Id = application.Id,
                    StudentEmail = application.User.Email,
                    Program = application.Program.Name,
                    University = application.Program.University.Name,
                    Status = application.State.Name,
                    SubmittedAt = application.SubmittedAt
                })
                .ToListAsync(),
            UpcomingDeadlines = await context.Deadlines
                .AsNoTracking()
                .Where(deadline => deadline.CompletedAt == null)
                .OrderBy(deadline => deadline.DueAt)
                .Take(8)
                .Select(deadline => new AdminDeadlineDto
                {
                    Id = deadline.Id,
                    StudentEmail = deadline.User.Email,
                    Title = deadline.Title,
                    Category = deadline.Category,
                    DueAt = deadline.DueAt,
                    IsOverdue = deadline.DueAt < now
                })
                .ToListAsync()
        };
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetUsersAsync() =>
        await context.Users
            .AsNoTracking()
            .OrderBy(user => user.Email)
            .Select(user => new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.Profile != null ? user.Profile.FirstName : string.Empty,
                LastName = user.Profile != null ? user.Profile.LastName : string.Empty,
                Role = user.Role,
                ApplicationCount = user.Applications.Count,
                DeadlineCount = user.Deadlines.Count
            })
            .ToListAsync();

    public async Task<AdminUserDto?> SetUserRoleAsync(int actorUserId, int userId, string role)
    {
        var normalizedRole = role.Trim();
        if (normalizedRole is not ("Admin" or "Student"))
        {
            throw new ArgumentException("Role must be Admin or Student.");
        }

        if (actorUserId == userId && normalizedRole != "Admin")
        {
            throw new InvalidOperationException("You cannot remove your own administrator access.");
        }

        var user = await context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId);
        if (user is null) return null;

        user.Role = normalizedRole;
        await context.SaveChangesAsync();
        return await context.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == userId)
            .Select(candidate => new AdminUserDto
            {
                Id = candidate.Id,
                Email = candidate.Email,
                FirstName = candidate.Profile != null ? candidate.Profile.FirstName : string.Empty,
                LastName = candidate.Profile != null ? candidate.Profile.LastName : string.Empty,
                Role = candidate.Role,
                ApplicationCount = candidate.Applications.Count,
                DeadlineCount = candidate.Deadlines.Count
            })
            .SingleAsync();
    }
}
