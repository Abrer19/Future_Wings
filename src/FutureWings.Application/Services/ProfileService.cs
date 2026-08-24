using FutureWings.Application.DTOs.Profile;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

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
