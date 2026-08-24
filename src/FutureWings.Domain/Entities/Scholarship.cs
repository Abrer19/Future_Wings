namespace FutureWings.Domain.Entities;

public class Scholarship
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public string Name { get; set; } = string.Empty;

    public Country Country { get; set; } = null!;
}
