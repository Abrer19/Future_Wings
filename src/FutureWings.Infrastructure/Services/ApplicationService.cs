using FutureWings.Application.DTOs.Application;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using DomainApplication = FutureWings.Domain.Entities.Application;

namespace FutureWings.Infrastructure.Services;

public sealed class ApplicationService(FutureWingsDbContext context) : IApplicationService
{
    public async Task<ApplicationStatusDto> CreateAsync(int userId, ApplicationCreateDto request)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId)) throw new KeyNotFoundException("User not found.");
        if (!await context.Programs.AnyAsync(program => program.Id == request.ProgramId)) throw new KeyNotFoundException("Program not found.");
        if (await context.Applications.AnyAsync(item => item.UserId == userId && item.ProgramId == request.ProgramId))
            throw new InvalidOperationException("You are already tracking an application for this program.");

        var draft = await context.ApplicationStates.SingleAsync(state => state.Name == "Draft");
        var application = new DomainApplication
        {
            UserId = userId,
            ProgramId = request.ProgramId,
            ApplicationStateId = draft.Id,
            SubmittedAt = DateTimeOffset.UtcNow,
        };
        context.Applications.Add(application);
        await context.SaveChangesAsync();
        return ToStatus(application.Id, draft.Name, application.SubmittedAt);
    }

    public async Task<IReadOnlyList<ApplicationDetailsDto>> GetAllAsync(int userId) =>
        await Query(userId).OrderByDescending(item => item.SubmittedAt).Select(item => new ApplicationDetailsDto
        {
            ApplicationId = item.Id, ProgramId = item.ProgramId, ProgramName = item.Program.Name,
            UniversityName = item.Program.University.Name, Status = item.State.Name, CreatedAt = item.SubmittedAt,
        }).ToListAsync();

    public async Task<ApplicationDetailsDto> GetAsync(int userId, int applicationId) =>
        await Query(userId).Where(item => item.Id == applicationId).Select(item => new ApplicationDetailsDto
        {
            ApplicationId = item.Id, ProgramId = item.ProgramId, ProgramName = item.Program.Name,
            UniversityName = item.Program.University.Name, Status = item.State.Name, CreatedAt = item.SubmittedAt,
        }).SingleOrDefaultAsync() ?? throw new KeyNotFoundException("Application not found.");

    public async Task<ApplicationStatusDto> UpdateStatusAsync(int userId, int applicationId, ApplicationStatusUpdateDto request)
    {
        var application = await context.Applications.SingleOrDefaultAsync(item => item.Id == applicationId && item.UserId == userId)
            ?? throw new KeyNotFoundException("Application not found.");
        var state = await context.ApplicationStates.SingleOrDefaultAsync(item => item.Name == request.Status)
            ?? throw new ArgumentException("Unknown application status.");
        application.ApplicationStateId = state.Id;
        await context.SaveChangesAsync();
        return ToStatus(application.Id, state.Name, DateTimeOffset.UtcNow);
    }

    public async Task DeleteAsync(int userId, int applicationId)
    {
        var application = await context.Applications.SingleOrDefaultAsync(item => item.Id == applicationId && item.UserId == userId)
            ?? throw new KeyNotFoundException("Application not found.");
        context.Applications.Remove(application);
        await context.SaveChangesAsync();
    }

    private IQueryable<DomainApplication> Query(int userId) => context.Applications.AsNoTracking().Where(item => item.UserId == userId);
    private static ApplicationStatusDto ToStatus(int id, string status, DateTimeOffset updatedAt) =>
        new() { ApplicationId = id, Status = status, UpdatedAt = updatedAt };
}
