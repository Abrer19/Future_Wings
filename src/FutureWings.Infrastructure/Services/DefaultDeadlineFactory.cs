using DeadlineEntity = FutureWings.Domain.Entities.Deadline;

namespace FutureWings.Infrastructure.Services;

internal static class DefaultDeadlineFactory
{
    public static IReadOnlyList<DeadlineEntity> CreateForUser(int userId, DateTimeOffset now) =>
    [
        Create(userId, "Complete your FutureWings profile", "Document",
            "Add your academic background, target countries, preferred programs, and budget.", now.AddDays(-7), now, now.AddDays(-5)),
        Create(userId, "Request academic recommendation letters", "Application",
            "Contact two instructors and share your CV, target programs, and submission timeline.", now.AddDays(-3), now),
        Create(userId, "Upload passport and academic transcripts", "Document",
            "Upload clear scans of your passport, certificates, marksheets, and official transcripts.", now.AddDays(7), now),
        Create(userId, "Book an IELTS or TOEFL test date", "Exam",
            "Choose a test date that leaves enough time for scores to reach your universities.", now.AddDays(14), now),
        Create(userId, "Finalize your university shortlist", "Application",
            "Select a balanced mix of ambitious, target, and safer universities based on your profile.", now.AddDays(21), now),
        Create(userId, "Submit priority scholarship applications", "Scholarship",
            "Review eligibility, prepare essays, and submit before each scholarship's priority deadline.", now.AddDays(35), now),
        Create(userId, "Prepare your student visa document checklist", "Visa",
            "Collect financial evidence, admission documents, photographs, and required identity records.", now.AddDays(60), now)
    ];

    private static DeadlineEntity Create(
        int userId,
        string title,
        string category,
        string notes,
        DateTimeOffset dueAt,
        DateTimeOffset createdAt,
        DateTimeOffset? completedAt = null) => new()
        {
            UserId = userId,
            Title = title,
            Category = category,
            Notes = notes,
            DueAt = dueAt,
            CreatedAt = createdAt,
            CompletedAt = completedAt
        };
}
