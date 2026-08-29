namespace FutureWings.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public UserProfile? Profile { get; set; }
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<Rating> Ratings { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}
