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

public class AgentStageMetricDto
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class AgentUniMetricDto
{
    public string UniversityName { get; set; } = string.Empty;
    public int ApplicantCount { get; set; }
}

public class AgentDegreeMetricDto
{
    public string Level { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class AgentOverviewDto
{
    public int CountryId { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TotalApplicants { get; set; }
    public int PendingReviewCount { get; set; }
    public int AcceptedCount { get; set; }
    public int RejectedCount { get; set; }
    public int SubmittedCount { get; set; }
    public int DraftCount { get; set; }
    public decimal AcceptanceRatePercent { get; set; }
    public int UniversitiesCount { get; set; }
    public int ProgramsCount { get; set; }
    public int ScholarshipsCount { get; set; }
    public decimal TotalPipelineTuitionUsd { get; set; }
    public decimal TotalPipelineTuitionTk { get; set; }
    public decimal EstimatedCommissionUsd { get; set; }
    public decimal EstimatedCommissionTk { get; set; }
    public string Currency { get; set; } = "Tk (BDT)";
    public string CurrencySymbol { get; set; } = "৳";
    public List<AgentStageMetricDto> StageBreakdown { get; set; } = [];
    public List<AgentUniMetricDto> TopUniversities { get; set; } = [];
    public List<AgentDegreeMetricDto> DegreeBreakdown { get; set; } = [];
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
    public decimal? BudgetTk { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string ProgramLevel { get; set; } = string.Empty;
    public decimal ProgramTuitionUsd { get; set; }
    public decimal ProgramTuitionTk { get; set; }
    public string UniversityName { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
}

public class AgentUniversityDto
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int ProgramsCount { get; set; }
    public int ApplicantsCount { get; set; }
}

public class AgentProgramDto
{
    public int Id { get; set; }
    public int UniversityId { get; set; }
    public string UniversityName { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal AnnualTuitionUsd { get; set; }
    public decimal AnnualTuitionTk { get; set; }
    public int DurationMonths { get; set; }
    public int MatchScore { get; set; }
    public string Tags { get; set; } = string.Empty;
    public int ApplicantsCount { get; set; }
}

public class AgentScholarshipDto
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
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

public class AgentBatchStatusDto
{
    public List<int> ApplicationIds { get; set; } = [];
    public string Status { get; set; } = string.Empty;
}
