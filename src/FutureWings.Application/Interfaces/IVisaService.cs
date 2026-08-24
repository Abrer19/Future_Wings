using FutureWings.Application.DTOs.Visa;

namespace FutureWings.Application.Interfaces;

public interface IVisaService
{
    Task<VisaRiskResultDto> GetRiskAsync(int applicationId);
}
