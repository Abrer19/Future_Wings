namespace FutureWings.Application.DTOs.Agent;

public class AgentCountryDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int UniversitiesCount { get; set; }
    public int ApplicationsCount { get; set; }
}

public class AgentOverviewDto
{
    public int CountryId { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public int TotalApplicants { get; set; }
    public int PendingReviewCount { get; set; }
    public int AcceptedCount { get; set; }
    public int RejectedCount { get; set; }
    public int UniversitiesCount { get; set; }
    public int ScholarshipsCount { get; set; }
}

public class AgentApplicantDto
{
    public int ApplicationId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? Major { get; set; }
    public decimal? Cgpa { get; set; }
    public decimal? BudgetUsd { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string UniversityName { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
}

public class AgentCreateProgramDto
{
    public int UniversityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = "Master's";
    public decimal AnnualTuitionUsd { get; set; }
    public int DurationMonths { get; set; } = 24;
    public string Tags { get; set; } = string.Empty;
}

public class AgentCreateScholarshipDto
{
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class AgentCreateUniversityDto
{
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
}
