namespace FutureWings.Application.DTOs.Review;

public class ReviewDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int UniversityId { get; set; }
    public string UniversityName { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string ReviewerName { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Comment { get; set; }
    public bool IsMine { get; set; }
}

public class ReviewCreateDto
{
    public int UniversityId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
}
