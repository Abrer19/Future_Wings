namespace FutureWings.Domain.Entities;

public class Country
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }

    public ICollection<University> Universities { get; set; } = [];
    public ICollection<Scholarship> Scholarships { get; set; } = [];
}
