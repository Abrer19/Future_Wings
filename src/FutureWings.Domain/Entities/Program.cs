namespace FutureWings.Domain.Entities;

public class Program
{
    public int Id { get; set; }
    public int UniversityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal AnnualTuitionUsd { get; set; }
    public int DurationMonths { get; set; }
    public int MatchScore { get; set; }
    public string Tags { get; set; } = string.Empty;

    public University University { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<SavedProgram> SavedByUsers { get; set; } = [];
}
