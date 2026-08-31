using FutureWings.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;
using DomainApplication = FutureWings.Domain.Entities.Application;

namespace FutureWings.Infrastructure.Data;

public sealed class FutureWingsDbContext(DbContextOptions<FutureWingsDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<University> Universities => Set<University>();
    public DbSet<AcademicProgram> Programs => Set<AcademicProgram>();
    public DbSet<Scholarship> Scholarships => Set<Scholarship>();
    public DbSet<DomainApplication> Applications => Set<DomainApplication>();
    public DbSet<ApplicationState> ApplicationStates => Set<ApplicationState>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<VisaOutcome> VisaOutcomes => Set<VisaOutcome>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Deadline> Deadlines => Set<Deadline>();
    public DbSet<SavedProgram> SavedPrograms => Set<SavedProgram>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(320);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.PasswordHash).HasMaxLength(100);
            entity.Property(user => user.Role).HasMaxLength(20).HasDefaultValue("Student");

            entity.HasOne(user => user.Profile)
                .WithOne(profile => profile.User)
                .HasForeignKey<UserProfile>(profile => profile.UserId);

            entity.HasMany(user => user.Applications)
                .WithOne(application => application.User)
                .HasForeignKey(application => application.UserId);

            entity.HasMany(user => user.Documents)
                .WithOne(document => document.User)
                .HasForeignKey(document => document.UserId);

            entity.HasMany(user => user.Ratings)
                .WithOne(rating => rating.User)
                .HasForeignKey(rating => rating.UserId);

            entity.HasMany(user => user.Notifications)
                .WithOne(notification => notification.User)
                .HasForeignKey(notification => notification.UserId);

            entity.HasMany(user => user.Payments)
                .WithOne(payment => payment.User)
                .HasForeignKey(payment => payment.UserId);

            entity.HasMany(user => user.Deadlines)
                .WithOne(deadline => deadline.User)
                .HasForeignKey(deadline => deadline.UserId);
        });

        modelBuilder.Entity<UserProfile>().HasKey(profile => profile.Id);

        modelBuilder.Entity<Country>(entity =>
        {
            entity.HasKey(country => country.Id);
            entity.Property(country => country.Name).HasMaxLength(100);
            entity.Property(country => country.Code).HasMaxLength(2);
            entity.Property(country => country.Description).HasMaxLength(250);
            entity.HasIndex(country => country.Code).IsUnique();

            entity.HasMany(country => country.Universities)
                .WithOne(university => university.Country)
                .HasForeignKey(university => university.CountryId);

            entity.HasMany(country => country.Scholarships)
                .WithOne(scholarship => scholarship.Country)
                .HasForeignKey(scholarship => scholarship.CountryId);
        });

        modelBuilder.Entity<University>(entity =>
        {
            entity.HasKey(university => university.Id);
            entity.Property(university => university.Name).HasMaxLength(200);
            entity.Property(university => university.City).HasMaxLength(100);

            entity.HasMany(university => university.Programs)
                .WithOne(program => program.University)
                .HasForeignKey(program => program.UniversityId);

            entity.HasMany(university => university.Ratings)
                .WithOne(rating => rating.University)
                .HasForeignKey(rating => rating.UniversityId);
        });

        modelBuilder.Entity<AcademicProgram>(entity =>
        {
            entity.HasKey(program => program.Id);
            entity.Property(program => program.Name).HasMaxLength(200);
            entity.Property(program => program.Level).HasMaxLength(50);
            entity.Property(program => program.AnnualTuitionUsd).HasPrecision(12, 2);
            entity.Property(program => program.Tags).HasMaxLength(500);

            entity.HasMany(program => program.Applications)
                .WithOne(application => application.Program)
                .HasForeignKey(application => application.ProgramId);
        });

        modelBuilder.Entity<SavedProgram>(entity =>
        {
            entity.HasKey(saved => new { saved.UserId, saved.ProgramId });
            entity.HasOne(saved => saved.User)
                .WithMany(user => user.SavedPrograms)
                .HasForeignKey(saved => saved.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(saved => saved.Program)
                .WithMany(program => program.SavedByUsers)
                .HasForeignKey(saved => saved.ProgramId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(saved => saved.ProgramId);
        });

        modelBuilder.Entity<Scholarship>().HasKey(scholarship => scholarship.Id);

        modelBuilder.Entity<DomainApplication>(entity =>
        {
            entity.HasKey(application => application.Id);

            entity.HasOne(application => application.State)
                .WithMany(state => state.Applications)
                .HasForeignKey(application => application.ApplicationStateId);

            entity.HasOne(application => application.VisaOutcome)
                .WithOne(outcome => outcome.Application)
                .HasForeignKey<VisaOutcome>(outcome => outcome.ApplicationId);
        });

        modelBuilder.Entity<ApplicationState>().HasKey(state => state.Id);
        modelBuilder.Entity<Document>().HasKey(document => document.Id);
        modelBuilder.Entity<VisaOutcome>().HasKey(outcome => outcome.Id);
        modelBuilder.Entity<Rating>().HasKey(rating => rating.Id);
        modelBuilder.Entity<Notification>().HasKey(notification => notification.Id);
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(payment => payment.Id);
            entity.Property(payment => payment.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Deadline>(entity =>
        {
            entity.HasKey(deadline => deadline.Id);
            entity.Property(deadline => deadline.Title).HasMaxLength(200);
            entity.Property(deadline => deadline.Category).HasMaxLength(50);
            entity.Property(deadline => deadline.Notes).HasMaxLength(1000);
            entity.HasIndex(deadline => new { deadline.UserId, deadline.DueAt });
        });
    }
}
