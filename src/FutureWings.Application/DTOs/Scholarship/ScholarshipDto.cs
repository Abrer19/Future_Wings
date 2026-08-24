namespace FutureWings.Application.DTOs.Scholarship;

public class ScholarshipDto
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EligibilityCriteria { get; set; } = string.Empty;
    public decimal? AwardAmount { get; set; }
}
