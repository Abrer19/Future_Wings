namespace FutureWings.Domain.Entities;

public class University
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    public Country Country { get; set; } = null!;
    public ICollection<Program> Programs { get; set; } = [];
    public ICollection<Rating> Ratings { get; set; } = [];
}
