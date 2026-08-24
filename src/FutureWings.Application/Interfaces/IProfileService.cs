using FutureWings.Application.DTOs.Profile;

namespace FutureWings.Application.Interfaces;

public interface IProfileService
{
    Task<ProfileDto> GetProfileAsync(int userId);
    Task<ProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto request);
}
