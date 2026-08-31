namespace FutureWings.Application.DTOs.Discovery;

public sealed class DiscoveryCountryDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int ProgramCount { get; init; }
}

public sealed class DiscoveryProgramDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string University { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string CountryCode { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public decimal AnnualTuitionUsd { get; init; }
    public int DurationMonths { get; init; }
    public int MatchScore { get; init; }
    public IReadOnlyList<string> Tags { get; init; } = [];
    public bool IsSaved { get; init; }
}

public sealed class DiscoveryResultDto
{
    public IReadOnlyList<DiscoveryCountryDto> FeaturedCountries { get; init; } = [];
    public IReadOnlyList<DiscoveryProgramDto> Programs { get; init; } = [];
    public IReadOnlyList<string> Countries { get; init; } = [];
    public IReadOnlyList<string> Levels { get; init; } = [];
    public int TotalCount { get; init; }
}
