using FutureWings.Application.DTOs.Visa;
using FutureWings.Application.Interfaces;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

/// <summary>Preparation checklist only; the score is not a prediction of a visa decision.</summary>
public sealed class VisaService(FutureWingsDbContext context) : IVisaService
{
    public async Task<VisaRiskResultDto> EvaluateRiskAsync(int userId, VisaAssessmentRequestDto request)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId))
            throw new KeyNotFoundException("User not found.");

        if (request.ApplicationId is int applicationId)
        {
            var application = await context.Applications.AsNoTracking()
                .Where(item => item.Id == applicationId && item.UserId == userId)
                .Select(item => new
                {
                    item.Program.Name, item.Program.Level, item.Program.Tags, item.Program.AnnualTuitionUsd,
                    Country = item.Program.University.Country.Name,
                    Major = item.User.Profile != null ? item.User.Profile.Major : null,
                }).SingleOrDefaultAsync() ?? throw new KeyNotFoundException("Application not found.");

            if (!string.Equals(request.DestinationCountry.Trim(), application.Country, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Destination country must match the tracked application.");

            return VisaRiskCalculator.Calculate(request, applicationId, application.AnnualTuitionUsd,
                application.Level, application.Major, application.Name, application.Tags);
        }

        return VisaRiskCalculator.Calculate(request, 0, request.AnnualTuitionUsd, null, null, null, null);
    }

    public async Task<VisaRiskResultDto?> GetRiskForApplicationAsync(int userId, int applicationId)
    {
        var application = await context.Applications.AsNoTracking()
            .Where(item => item.Id == applicationId && item.UserId == userId)
            .Select(item => new
            {
                item.Program.Name, item.Program.Level, item.Program.Tags, item.Program.AnnualTuitionUsd,
                Country = item.Program.University.Country.Name,
                Major = item.User.Profile != null ? item.User.Profile.Major : null,
                Budget = item.User.Profile != null ? item.User.Profile.BudgetUsd : null,
                DegreeLevel = item.User.Profile != null ? item.User.Profile.DegreeLevel : null,
            }).SingleOrDefaultAsync();

        if (application is null) return null;

        // Tracked applications do not store visa documents or test results. Unknown evidence
        // stays unknown until the student supplies it in the interactive assessment.
        var request = new VisaAssessmentRequestDto
        {
            DestinationCountry = application.Country,
            DegreeLevel = application.DegreeLevel ?? application.Level,
            AvailableFundsUsd = application.Budget,
            FinancialAdequacyScore = application.Budget.HasValue ? 50 : 0,
            TiesToHomeCountryScore = 0,
            IntendedMajor = application.Major,
        };
        return VisaRiskCalculator.Calculate(request, applicationId, application.AnnualTuitionUsd,
            application.Level, application.Major, application.Name, application.Tags);
    }
}
