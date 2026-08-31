using FutureWings.Application.DTOs.Profile;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Returns placeholder@example.com; never reads or writes UserProfiles.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IProfileService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
public class ProfileService : IProfileService
{
    public Task<ProfileDto> GetProfileAsync(int userId) =>
        Task.FromResult(new ProfileDto { UserId = userId, Email = "placeholder@example.com" });

    public Task<ProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto request) =>
        Task.FromResult(new ProfileDto
        {
            UserId = userId,
            Email = "placeholder@example.com",
            FirstName = request.FirstName,
            LastName = request.LastName
        });
}
