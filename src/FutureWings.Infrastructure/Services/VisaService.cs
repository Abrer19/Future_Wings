using FutureWings.Application.DTOs.Visa;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Returns a hardcoded 0.5 risk score labelled "Placeholder".
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IVisaService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
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
