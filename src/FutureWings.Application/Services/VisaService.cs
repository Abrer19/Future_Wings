using FutureWings.Application.DTOs.Visa;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class VisaService : IVisaService
{
    public Task<VisaRiskResultDto> GetRiskAsync(int applicationId) =>
        Task.FromResult(new VisaRiskResultDto
        {
            ApplicationId = applicationId,
            RiskScore = 0.5m,
            RiskLevel = "Placeholder"
        });
}
