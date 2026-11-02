namespace FutureWings.Domain.Entities;

public class Scholarship
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EligibilityCriteria { get; set; } = string.Empty;
    public string? RequiredDocuments { get; set; }
    public string? StudyLevel { get; set; }
    public string? FieldOfStudy { get; set; }
    public string? OfficialLink { get; set; }
    public decimal? AwardAmount { get; set; }
    public DateTimeOffset? Deadline { get; set; }

    public Country Country { get; set; } = null!;
    public ICollection<ScholarshipInterest> Interests { get; set; } = [];
}
