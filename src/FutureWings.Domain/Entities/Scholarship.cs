namespace FutureWings.Domain.Entities;

public class Scholarship
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EligibilityCriteria { get; set; } = string.Empty;
    public decimal? AwardAmount { get; set; }
    public DateTimeOffset? Deadline { get; set; }

    public Country Country { get; set; } = null!;
}
