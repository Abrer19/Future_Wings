namespace FutureWings.Domain.Entities;

public class SavedProgram
{
    public int UserId { get; set; }
    public int ProgramId { get; set; }
    public DateTimeOffset SavedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;
    public Program Program { get; set; } = null!;
}
