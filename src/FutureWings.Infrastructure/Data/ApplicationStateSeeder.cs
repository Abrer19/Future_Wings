using FutureWings.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Data;

/// <summary>
/// Seeds the lifecycle states an application can be in.
///
/// Application.ApplicationStateId is a non-nullable FK, so until this table has
/// rows no application can be inserted at all — the Applications feature is
/// blocked at the database level, not just at the service layer.
/// </summary>
public static class ApplicationStateSeeder
{
    // Ordered as an application progresses. Draft is the state a new application
    // starts in, so it is seeded first and gets the lowest id.
    private static readonly string[] StateNames =
    [
        "Draft",
        "Submitted",
        "Under Review",
        "Accepted",
        "Rejected",
        "Withdrawn"
    ];

    public static async Task SeedAsync(FutureWingsDbContext context)
    {
        var existing = await context.ApplicationStates
            .Select(state => state.Name)
            .ToListAsync();

        var missing = StateNames
            .Where(name => !existing.Contains(name))
            .Select(name => new ApplicationState { Name = name })
            .ToList();

        if (missing.Count == 0) return;

        context.ApplicationStates.AddRange(missing);
        await context.SaveChangesAsync();
    }
}
