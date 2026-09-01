using FutureWings.Application.DTOs.Profile;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// Reads and writes the signed-in student's profile.
///
/// Every method is scoped by <paramref name="userId"/>, which the controller takes
/// from the JWT claim — never from the route — so one user can never address another's
/// profile.
/// </summary>
public sealed class ProfileService(FutureWingsDbContext context) : IProfileService
{
    public async Task<ProfileDto> GetProfileAsync(int userId)
    {
        var profile = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new ProfileDto
            {
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.Profile != null ? user.Profile.FirstName : string.Empty,
                LastName = user.Profile != null ? user.Profile.LastName : string.Empty,
                Cgpa = user.Profile != null ? user.Profile.Cgpa : null,
                Major = user.Profile != null ? user.Profile.Major : null,
                BudgetUsd = user.Profile != null ? user.Profile.BudgetUsd : null,
                DegreeLevel = user.Profile != null ? user.Profile.DegreeLevel : null,
            })
            .SingleOrDefaultAsync();

        return profile ?? throw new KeyNotFoundException("Profile not found.");
    }

    public async Task<ProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto request)
    {
        var user = await context.Users
            .Include(candidate => candidate.Profile)
            .SingleOrDefaultAsync(candidate => candidate.Id == userId)
            ?? throw new KeyNotFoundException("Profile not found.");

        // Registration always creates a profile, but tolerate a missing one rather than
        // throwing on an account created by some other path.
        user.Profile ??= new UserProfile { UserId = userId };

        user.Profile.FirstName = request.FirstName.Trim();
        user.Profile.LastName = request.LastName.Trim();
        user.Profile.Cgpa = request.Cgpa;
        user.Profile.Major = Normalize(request.Major);
        user.Profile.BudgetUsd = request.BudgetUsd;
        user.Profile.DegreeLevel = Normalize(request.DegreeLevel);

        await context.SaveChangesAsync();
        return await GetProfileAsync(userId);
    }

    /// Blank input clears the field back to null ("not set") rather than storing "".
    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
