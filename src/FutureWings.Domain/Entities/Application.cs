namespace FutureWings.Domain.Entities;

public class Application
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ProgramId { get; set; }
    public int ApplicationStateId { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }

    public User User { get; set; } = null!;
    public Program Program { get; set; } = null!;
    public ApplicationState State { get; set; } = null!;
    public VisaOutcome? VisaOutcome { get; set; }
}
