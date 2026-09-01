namespace FutureWings.Domain.Entities;

public class UserProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // Study-plan details. All nullable on purpose: null means "the student has not
    // filled this in yet", which is exactly what the roadmap graph reads to decide
    // whether a field is a completed step or an outstanding gap. Do not give these
    // non-null defaults — that would make an empty profile indistinguishable from a
    // deliberately-entered zero.
    public decimal? Cgpa { get; set; }
    public string? Major { get; set; }
    public decimal? BudgetUsd { get; set; }
    public string? DegreeLevel { get; set; }

    public User User { get; set; } = null!;
}
