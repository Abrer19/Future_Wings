namespace FutureWings.Domain.Entities;

public class Program
{
    public int Id { get; set; }
    public int UniversityId { get; set; }
    public string Name { get; set; } = string.Empty;

    public University University { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
}
