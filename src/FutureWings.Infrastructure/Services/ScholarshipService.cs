using FutureWings.Application.DTOs.Scholarship;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class ScholarshipService(FutureWingsDbContext context) : IScholarshipService
{
    public async Task<IReadOnlyList<ScholarshipDto>> GetAllAsync(int? countryId = null, string? search = null, int? currentUserId = null)
    {
        var query = context.Scholarships.AsNoTracking().Include(item => item.Country).AsQueryable();
        if (countryId.HasValue) query = query.Where(item => item.CountryId == countryId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var normalized = term.ToLower();
            query = query.Where(item => item.Name.ToLower().Contains(normalized) ||
                item.Country.Name.ToLower().Contains(normalized));
        }

        HashSet<int>? interestedIds = null;
        if (currentUserId.HasValue)
        {
            interestedIds = (await context.ScholarshipInterests.AsNoTracking()
                .Where(i => i.UserId == currentUserId.Value)
                .Select(i => i.ScholarshipId)
                .ToListAsync())
                .ToHashSet();
        }

        var items = await query.OrderBy(item => item.Deadline).ThenBy(item => item.Name).ToListAsync();

        return items.Select(item => ToDto(item, interestedIds?.Contains(item.Id) ?? false, null)).ToList();
    }

    public async Task<ScholarshipDto?> GetByIdAsync(int id, int? currentUserId = null)
    {
        var item = await context.Scholarships.AsNoTracking()
            .Include(s => s.Country)
            .SingleOrDefaultAsync(s => s.Id == id);

        if (item is null) return null;

        ScholarshipInterestDto? interestDto = null;
        var isInterested = false;

        if (currentUserId.HasValue)
        {
            var interest = await context.ScholarshipInterests.AsNoTracking()
                .Include(i => i.Steps)
                .SingleOrDefaultAsync(i => i.UserId == currentUserId.Value && i.ScholarshipId == id);

            if (interest != null)
            {
                isInterested = true;
                interestDto = ToInterestDto(interest);
            }
        }

        return ToDto(item, isInterested, interestDto);
    }

    public async Task<ScholarshipInterestDto> SetInterestAsync(int userId, int scholarshipId)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId))
            throw new KeyNotFoundException("User not found.");

        var scholarship = await context.Scholarships.Include(s => s.Country)
            .SingleOrDefaultAsync(s => s.Id == scholarshipId)
            ?? throw new KeyNotFoundException("Scholarship not found.");

        var existing = await context.ScholarshipInterests
            .Include(i => i.Steps)
            .SingleOrDefaultAsync(i => i.UserId == userId && i.ScholarshipId == scholarshipId);

        if (existing is not null)
        {
            return ToInterestDto(existing);
        }

        var interest = new ScholarshipInterest
        {
            UserId = userId,
            ScholarshipId = scholarshipId,
            CreatedAt = DateTimeOffset.UtcNow,
            Steps = GenerateDefaultSteps(scholarship)
        };

        context.ScholarshipInterests.Add(interest);
        await context.SaveChangesAsync();

        return ToInterestDto(interest);
    }

    public async Task<ScholarshipInterestDto?> GetProcessAsync(int userId, int scholarshipId)
    {
        var interest = await context.ScholarshipInterests.AsNoTracking()
            .Include(i => i.Steps)
            .SingleOrDefaultAsync(i => i.UserId == userId && i.ScholarshipId == scholarshipId);

        return interest is null ? null : ToInterestDto(interest);
    }

    public async Task<ScholarshipChecklistStepDto> UpdateChecklistStepAsync(
        int userId, int scholarshipId, int stepId, bool isCompleted)
    {
        var step = await context.ScholarshipChecklistSteps
            .Include(s => s.ScholarshipInterest)
            .SingleOrDefaultAsync(s => s.Id == stepId)
            ?? throw new KeyNotFoundException("Checklist step not found.");

        if (step.ScholarshipInterest.UserId != userId)
        {
            throw new UnauthorizedAccessException("You do not have permission to modify this checklist step.");
        }

        if (step.ScholarshipInterest.ScholarshipId != scholarshipId)
        {
            throw new ArgumentException("Checklist step does not belong to the specified scholarship.");
        }

        step.IsCompleted = isCompleted;
        step.CompletedAt = isCompleted ? DateTimeOffset.UtcNow : null;
        await context.SaveChangesAsync();

        return ToStepDto(step);
    }

    private static List<ScholarshipChecklistStep> GenerateDefaultSteps(Scholarship scholarship)
    {
        var steps = new List<ScholarshipChecklistStep>();

        // Step 1: Confirm eligibility
        var eligibilityDesc = !string.IsNullOrWhiteSpace(scholarship.EligibilityCriteria)
            ? $"Verify all requirements: {scholarship.EligibilityCriteria}"
            : "Review program requirements and confirm you satisfy all academic and nationality criteria.";
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "eligibility",
            StepOrder = 1,
            Title = "Confirm eligibility",
            Description = eligibilityDesc,
            IsCompleted = false
        });

        // Step 2: Prepare academic documents
        var academicDesc = !string.IsNullOrWhiteSpace(scholarship.StudyLevel)
            ? $"Gather official transcripts, GPA certification, and degree certificates for {scholarship.StudyLevel} admission."
            : "Gather certified academic transcripts, graduation certificates, and grading scale documentation.";
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "academic_docs",
            StepOrder = 2,
            Title = "Prepare academic documents",
            Description = academicDesc,
            IsCompleted = false
        });

        // Step 3: Prepare language proof
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "language_proof",
            StepOrder = 3,
            Title = "Prepare language proof",
            Description = "Obtain official English or host country language proficiency scores (IELTS, TOEFL, or recognized certificate).",
            IsCompleted = false
        });

        // Step 4: Prepare recommendation letters
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "recommendations",
            StepOrder = 4,
            Title = "Prepare recommendation letters",
            Description = "Request 2-3 academic or professional recommendation letters from professors or employers.",
            IsCompleted = false
        });

        // Step 5: Write personal statement
        var statementDesc = !string.IsNullOrWhiteSpace(scholarship.FieldOfStudy) && !scholarship.FieldOfStudy.Equals("All fields", StringComparison.OrdinalIgnoreCase)
            ? $"Draft and refine personal statement and study plan tailored to {scholarship.FieldOfStudy}."
            : "Draft and polish your personal statement or motivation essay highlighting your research, achievements, and goals.";
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "personal_statement",
            StepOrder = 5,
            Title = "Write personal statement",
            Description = statementDesc,
            IsCompleted = false
        });

        // Step 6: Submit scholarship application
        var submitDesc = !string.IsNullOrWhiteSpace(scholarship.OfficialLink)
            ? $"Complete all application sections and submit via official portal ({scholarship.OfficialLink}) before the deadline."
            : "Complete and submit your official scholarship application package before the deadline.";
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "submit",
            StepOrder = 6,
            Title = "Submit the scholarship application",
            Description = submitDesc,
            IsCompleted = false
        });

        // Step 7: Track the final result
        var trackDesc = scholarship.Deadline.HasValue
            ? $"Monitor application status, schedule interviews if shortlisted, and await final results (Deadline: {scholarship.Deadline.Value:MMM dd, yyyy})."
            : "Monitor application status, schedule interviews if shortlisted, and track decision notifications.";
        steps.Add(new ScholarshipChecklistStep
        {
            StepKey = "track",
            StepOrder = 7,
            Title = "Track the final result",
            Description = trackDesc,
            IsCompleted = false
        });

        return steps;
    }

    private static ScholarshipDto ToDto(Scholarship item, bool isInterested, ScholarshipInterestDto? interest) => new()
    {
        Id = item.Id,
        CountryId = item.CountryId,
        CountryName = item.Country?.Name ?? string.Empty,
        CountryCode = item.Country?.Code ?? string.Empty,
        Name = item.Name,
        Description = item.Description,
        EligibilityCriteria = item.EligibilityCriteria,
        RequiredDocuments = item.RequiredDocuments,
        StudyLevel = item.StudyLevel,
        FieldOfStudy = item.FieldOfStudy,
        OfficialLink = item.OfficialLink,
        AwardAmount = item.AwardAmount,
        Deadline = item.Deadline,
        IsInterested = isInterested,
        Interest = interest
    };

    private static ScholarshipInterestDto ToInterestDto(ScholarshipInterest item) => new()
    {
        Id = item.Id,
        UserId = item.UserId,
        ScholarshipId = item.ScholarshipId,
        CreatedAt = item.CreatedAt,
        Steps = item.Steps.OrderBy(s => s.StepOrder).Select(ToStepDto).ToList()
    };

    private static ScholarshipChecklistStepDto ToStepDto(ScholarshipChecklistStep s) => new()
    {
        Id = s.Id,
        ScholarshipInterestId = s.ScholarshipInterestId,
        StepKey = s.StepKey,
        Title = s.Title,
        Description = s.Description,
        StepOrder = s.StepOrder,
        IsCompleted = s.IsCompleted,
        CompletedAt = s.CompletedAt
    };
}
