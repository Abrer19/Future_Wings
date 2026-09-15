using FutureWings.Application.DTOs.Admin;
using FutureWings.Application.DTOs.Agent;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using FutureWings.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using DomainApplication = FutureWings.Domain.Entities.Application;
using AcademicProgram = FutureWings.Domain.Entities.Program;

namespace FutureWings.Tests.Services;

public class AdminAndAgentServiceTests
{
    private static FutureWingsDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new FutureWingsDbContext(options);

        context.ApplicationStates.AddRange(
            new ApplicationState { Id = 1, Name = "Draft" },
            new ApplicationState { Id = 2, Name = "Submitted" },
            new ApplicationState { Id = 3, Name = "Under Review" },
            new ApplicationState { Id = 4, Name = "Accepted" },
            new ApplicationState { Id = 5, Name = "Rejected" }
        );

        var country = new Country { Id = 1, Name = "Canada", Code = "CA" };
        var university = new University { Id = 1, CountryId = 1, Name = "University of Toronto", City = "Toronto" };
        var program = new AcademicProgram { Id = 1, UniversityId = 1, Name = "MSc Computer Science", Level = "Master's", AnnualTuitionUsd = 31000, DurationMonths = 24 };

        var adminUser = new User { Id = 1, Email = "admin@test.com", Role = "Admin", SubscriptionTier = "Premium" };
        var agentUser = new User { Id = 2, Email = "agent@test.com", Role = "Agent", SubscriptionTier = "Pro" };
        var studentUser = new User { Id = 3, Email = "student@test.com", Role = "Student", SubscriptionTier = "Free" };

        context.Countries.Add(country);
        context.Universities.Add(university);
        context.Programs.Add(program);
        context.Users.AddRange(adminUser, agentUser, studentUser);

        context.Applications.Add(new DomainApplication
        {
            Id = 1,
            UserId = 3,
            ProgramId = 1,
            ApplicationStateId = 2,
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-5)
        });

        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task AdminService_GetDashboardAsync_ReturnsAccurateMetrics()
    {
        using var context = CreateInMemoryDbContext();
        var adminService = new AdminService(context);

        var dashboard = await adminService.GetDashboardAsync();

        Assert.Equal(3, dashboard.TotalUsers);
        Assert.Equal(1, dashboard.AdminUsers);
        Assert.Equal(1, dashboard.AgentUsers);
        Assert.Equal(1, dashboard.TotalApplications);
        Assert.Single(dashboard.RecentApplications);
    }

    [Fact]
    public async Task AdminService_SetUserRoleAsync_AllowsAdminAgentStudent()
    {
        using var context = CreateInMemoryDbContext();
        var adminService = new AdminService(context);

        var updatedToAgent = await adminService.SetUserRoleAsync(1, 3, "Agent");
        Assert.NotNull(updatedToAgent);
        Assert.Equal("Agent", updatedToAgent.Role);

        var updatedToAdmin = await adminService.SetUserRoleAsync(1, 3, "Admin");
        Assert.NotNull(updatedToAdmin);
        Assert.Equal("Admin", updatedToAdmin.Role);

        await Assert.ThrowsAsync<ArgumentException>(() => adminService.SetUserRoleAsync(1, 3, "InvalidRole"));
    }

    [Fact]
    public async Task AdminService_SetUserSubscriptionTierAsync_UpdatesTierProperly()
    {
        using var context = CreateInMemoryDbContext();
        var adminService = new AdminService(context);

        var updated = await adminService.SetUserSubscriptionTierAsync(3, "Pro");
        Assert.NotNull(updated);
        Assert.Equal("Pro", updated.SubscriptionTier);

        var userInDb = await context.Users.FindAsync(3);
        Assert.NotNull(userInDb);
        Assert.Equal("Pro", userInDb.SubscriptionTier);
        Assert.NotNull(userInDb.SubscriptionRenewsAt);
    }

    [Fact]
    public async Task AgentService_GetCountryOverviewAsync_ReturnsCountryStats()
    {
        using var context = CreateInMemoryDbContext();
        var agentService = new AgentService(context);

        var overview = await agentService.GetCountryOverviewAsync(1);

        Assert.Equal(1, overview.CountryId);
        Assert.Equal("Canada", overview.CountryName);
        Assert.Equal(1, overview.TotalApplicants);
        Assert.Equal(1, overview.PendingReviewCount);
    }

    [Fact]
    public async Task AgentService_UpdateApplicantStatusAsync_UpdatesApplicationState()
    {
        using var context = CreateInMemoryDbContext();
        var agentService = new AgentService(context);

        var updated = await agentService.UpdateApplicantStatusAsync(1, "Accepted");
        Assert.True(updated);

        var appInDb = await context.Applications.FindAsync(1);
        Assert.NotNull(appInDb);
        Assert.Equal(4, appInDb.ApplicationStateId);
    }

    [Fact]
    public async Task AdminService_GetRevenueOverviewAsync_ReturnsCorrectMrrAndTierDistribution()
    {
        using var context = CreateInMemoryDbContext();
        var adminService = new AdminService(context);

        var revenue = await adminService.GetRevenueOverviewAsync();

        Assert.Equal(3, revenue.TotalUsers);
        Assert.Equal(1, revenue.ProTierCount);
        Assert.Equal(1, revenue.PremiumTierCount);
        Assert.Equal(1, revenue.FreeTierCount);
        Assert.Equal(2, revenue.ActivePaidSubscribers);
        // Pro ($19) + Premium ($49) = $68 MRR
        Assert.Equal(68.00m, revenue.MonthlyRecurringRevenueUsd);
        Assert.Equal(68.00m * 12.00m, revenue.AnnualRunRateUsd);
        Assert.NotEmpty(revenue.MonthlyBreakdown);
    }
}
