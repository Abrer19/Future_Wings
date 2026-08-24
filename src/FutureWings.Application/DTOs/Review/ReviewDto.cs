namespace FutureWings.Application.DTOs.Review;

public class ReviewDto
{
    public int UserId { get; set; }
    public int UniversityId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
}
