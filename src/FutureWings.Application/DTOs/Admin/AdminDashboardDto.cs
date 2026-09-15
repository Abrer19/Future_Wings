namespace FutureWings.Application.DTOs.Admin;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int AdminUsers { get; set; }
    public int AgentUsers { get; set; }
    public int TotalApplications { get; set; }
    public int TotalUniversities { get; set; }
    public int TotalPrograms { get; set; }
    public int TotalCountries { get; set; }
    public int ActiveDeadlines { get; set; }
    public int OverdueDeadlines { get; set; }
    public int CompletedDeadlines { get; set; }
    public IReadOnlyList<AdminApplicationDto> RecentApplications { get; set; } = [];
    public IReadOnlyList<AdminDeadlineDto> UpcomingDeadlines { get; set; } = [];
}

