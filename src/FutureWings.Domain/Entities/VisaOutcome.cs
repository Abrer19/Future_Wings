namespace FutureWings.Domain.Entities;

public class VisaOutcome
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? DecisionDate { get; set; }

    public Application Application { get; set; } = null!;
}
