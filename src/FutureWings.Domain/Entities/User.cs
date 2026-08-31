namespace FutureWings.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";

    /// <summary>
    /// True once the onboarding deadlines have been created for this account.
    /// Seeding is keyed off this flag rather than off "does the user currently have
    /// zero deadlines", so deleting every deadline never re-triggers it.
    /// </summary>
    public bool HasSeededDeadlines { get; set; }

    public UserProfile? Profile { get; set; }
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<Rating> Ratings { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<Deadline> Deadlines { get; set; } = [];
    public ICollection<SavedProgram> SavedPrograms { get; set; } = [];
}
