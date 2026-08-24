namespace FutureWings.Domain.Entities;

public class ApplicationState
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Application> Applications { get; set; } = [];
}
