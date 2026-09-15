using System.ComponentModel.DataAnnotations;
using FutureWings.Application.DTOs.Visa;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using FutureWings.Infrastructure.Services;
using FutureWings.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;
using TrackedApplication = FutureWings.Domain.Entities.Application;

namespace FutureWings.Tests.Services;

public sealed class VisaServiceTests
{
    private static VisaAssessmentRequestDto ReadyRequest() => new()
    {
        DestinationCountry = "Canada", DegreeLevel = "Master's", HasFundingProof = true,
        HasLanguageScore = true, IeltsOverallScore = 7.5m, FinancialAdequacyScore = 90,
        TiesToHomeCountryScore = 90, AnnualTuitionUsd = 30000m, AvailableFundsUsd = 60000m,
        IntendedMajor = "Computer Science",
    };

    [Fact]
    public void ReadyEvidence_IsLowRisk()
    {
        var result = VisaRiskCalculator.Calculate(ReadyRequest());
        Assert.Equal("Low", result.RiskLevel);
        Assert.InRange(result.RiskScore, 0, 29);
        Assert.NotEmpty(result.Recommendations);
    }

    [Fact]
    public void MissingEvidenceAndShortFunds_AreHighRiskAndActionable()
    {
        var request = ReadyRequest();
        request.HasFundingProof = false; request.HasLanguageScore = false;
        request.AvailableFundsUsd = 10000m; request.TiesToHomeCountryScore = 10;
        request.HasPriorVisaRefusal = true;
        var result = VisaRiskCalculator.Calculate(request);
        Assert.Equal("High", result.RiskLevel);
        Assert.Contains(result.Reasons, reason => reason.Contains("tuition and living", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Recommendations, item => item.Contains("sponsor affidavit", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Recommendations, item => item.Contains("refusal", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void LanguageAndAcademicMismatch_IncreaseRisk()
    {
        var request = ReadyRequest();
        request.IeltsOverallScore = 5.5m; request.DegreeLevel = "Bachelor's";
        var result = VisaRiskCalculator.Calculate(request, 1, 30000m, "Master's",
            "History", "MSc Computer Science", "Computing");
        Assert.Contains(result.Reasons, reason => reason.Contains("IELTS"));
        Assert.Contains(result.Reasons, reason => reason.Contains("degree level"));
        Assert.Contains(result.Reasons, reason => reason.Contains("academic major"));
    }

    [Fact]
    public void RequestValidation_RejectsInvalidScoresAndMissingCountry()
    {
        var request = ReadyRequest();
        request.DestinationCountry = ""; request.IeltsOverallScore = 10;
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), errors, true));
        Assert.True(errors.Count >= 2);
    }

    [Fact]
    public void Controller_RequiresAuthentication() =>
        Assert.NotNull(Attribute.GetCustomAttribute(typeof(VisaController), typeof(AuthorizeAttribute)));

    [Fact]
    public async Task ApplicationReport_IsScopedToOwner()
    {
        await using var context = CreateContext();
        SeedApplication(context);
        var service = new VisaService(context);
        Assert.Null(await service.GetRiskForApplicationAsync(2, 1));
        var report = await service.GetRiskForApplicationAsync(1, 1);
        Assert.NotNull(report);
        Assert.Equal(1, report.ApplicationId);
        Assert.Contains(report.Reasons, reason => reason.Contains("Funding evidence"));
    }

    [Fact]
    public async Task Evaluation_RejectsAnotherUsersApplication()
    {
        await using var context = CreateContext();
        SeedApplication(context);
        var request = ReadyRequest(); request.ApplicationId = 1;
        await Assert.ThrowsAsync<KeyNotFoundException>(() => new VisaService(context).EvaluateRiskAsync(2, request));
    }

    [Fact]
    public async Task Evaluation_UsesTrackedTuitionInsteadOfClientTuition()
    {
        await using var context = CreateContext();
        SeedApplication(context);
        var request = ReadyRequest(); request.ApplicationId = 1;
        request.AnnualTuitionUsd = 1; request.AvailableFundsUsd = 20000;
        var report = await new VisaService(context).EvaluateRiskAsync(1, request);
        Assert.Contains(report.Reasons, reason => reason.Contains("tuition and living", StringComparison.OrdinalIgnoreCase));
    }

    private static FutureWingsDbContext CreateContext() => new(
        new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static void SeedApplication(FutureWingsDbContext context)
    {
        context.Users.AddRange(new User { Id = 1, Email = "a@example.com" }, new User { Id = 2, Email = "b@example.com" });
        context.Countries.Add(new Country { Id = 1, Name = "Canada", Code = "CA" });
        context.Universities.Add(new University { Id = 1, CountryId = 1, Name = "Test University" });
        context.Programs.Add(new AcademicProgram { Id = 1, UniversityId = 1, Name = "MSc Computer Science", Level = "Master's", AnnualTuitionUsd = 30000 });
        context.ApplicationStates.Add(new ApplicationState { Id = 1, Name = "Draft" });
        context.Applications.Add(new TrackedApplication { Id = 1, UserId = 1, ProgramId = 1, ApplicationStateId = 1 });
        context.SaveChanges();
    }
}
