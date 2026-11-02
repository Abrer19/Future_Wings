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

        if (profile == null)
        {
            throw new KeyNotFoundException("Profile not found.");
        }

        PopulateAcademicCompletion(profile);
        return profile;
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

    /// <summary>
    /// Evaluates the four required academic core fields:
    /// 1. CGPA: numeric and within [0, 4.0]
    /// 2. Major: non-empty after trimming
    /// 3. BudgetUsd: numeric and strictly greater than zero (> 0)
    /// 4. DegreeLevel: non-empty after trimming
    /// </summary>
    public static void PopulateAcademicCompletion(ProfileDto dto)
    {
        var missing = new List<string>();

        if (!dto.Cgpa.HasValue || dto.Cgpa.Value < 0m || dto.Cgpa.Value > 4.0m)
        {
            missing.Add("CGPA");
        }

        if (string.IsNullOrWhiteSpace(dto.Major))
        {
            missing.Add("Target Major");
        }

        if (!dto.BudgetUsd.HasValue || dto.BudgetUsd.Value <= 0m)
        {
            missing.Add("Annual Budget");
        }

        if (string.IsNullOrWhiteSpace(dto.DegreeLevel))
        {
            missing.Add("Target Degree Level");
        }

        dto.TotalRequiredCoreFieldsCount = 4;
        dto.CompletedCoreFieldsCount = 4 - missing.Count;
        dto.MissingCoreFields = missing;
        dto.IsAcademicComplete = missing.Count == 0;
        dto.CompletionPercentage = (int)Math.Round((double)dto.CompletedCoreFieldsCount / dto.TotalRequiredCoreFieldsCount * 100);
    }

    /// Blank input clears the field back to null ("not set") rather than storing "".
    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
