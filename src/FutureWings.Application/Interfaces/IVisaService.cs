using FutureWings.Application.DTOs.Visa;

namespace FutureWings.Application.Interfaces;

public interface IVisaService
{
    Task<VisaRiskResultDto> EvaluateRiskAsync(int userId, VisaAssessmentRequestDto request);
    Task<VisaRiskResultDto?> GetRiskForApplicationAsync(int userId, int applicationId);
}
