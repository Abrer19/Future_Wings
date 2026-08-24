namespace FutureWings.Domain.Entities;

public class Rating
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int UniversityId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }

    public User User { get; set; } = null!;
    public University University { get; set; } = null!;
}
