using Microsoft.EntityFrameworkCore;
using AcademicProgram = FutureWings.Domain.Entities.Program;
using FutureWings.Domain.Entities;

namespace FutureWings.Infrastructure.Data;

public static class DiscoverySeeder
{
    public static async Task SeedAsync(FutureWingsDbContext context)
    {
        var seeds = new[]
        {
            new Seed("CA", "Canada", "Post-study work options", true, "University of Toronto", "Toronto", "MSc Computer Science", "Master's", 31000m, 24, 96, "AI & Data,Co-op available"),
            new Seed("DE", "Germany", "Affordable public universities", true, "Technical University of Munich", "Munich", "MSc Informatics", "Master's", 6500m, 24, 93, "Research-led,Low tuition"),
            new Seed("AU", "Australia", "Globally ranked institutions", true, "University of Melbourne", "Melbourne", "Master of Information Technology", "Master's", 34000m, 24, 89, "Industry project,Global network"),
            new Seed("NL", "Netherlands", "English-taught programs", true, "University of Amsterdam", "Amsterdam", "BSc Business Analytics", "Bachelor's", 14200m, 36, 86, "English taught,Analytics"),
            new Seed("GB", "United Kingdom", "Career-focused one-year degrees", false, "University of Manchester", "Manchester", "MSc Data Science", "Master's", 38000m, 12, 84, "One-year degree,Career support"),
            new Seed("FI", "Finland", "Innovative education and scholarships", false, "Aalto University", "Espoo", "MSc Human-Computer Interaction", "Master's", 16400m, 24, 81, "Design & tech,Scholarships")
        };

        foreach (var seed in seeds)
        {
            var country = await context.Countries.SingleOrDefaultAsync(item => item.Code == seed.CountryCode);
            if (country is null)
            {
                country = new Country
                {
                    Code = seed.CountryCode,
                    Name = seed.CountryName,
                    Description = seed.CountryDescription,
                    IsFeatured = seed.IsFeatured
                };
                context.Countries.Add(country);
            }
            else
            {
                country.Name = seed.CountryName;
                country.Description = seed.CountryDescription;
                country.IsFeatured = seed.IsFeatured;
            }

            var university = await context.Universities.SingleOrDefaultAsync(item =>
                item.Name == seed.UniversityName && item.CountryId == country.Id);
            if (university is null)
            {
                university = new University { Name = seed.UniversityName, City = seed.City, Country = country };
                context.Universities.Add(university);
            }
            else
            {
                university.City = seed.City;
            }

            var program = await context.Programs.SingleOrDefaultAsync(item =>
                item.Name == seed.ProgramName && item.UniversityId == university.Id);
            if (program is null)
            {
                program = new AcademicProgram { Name = seed.ProgramName, University = university };
                context.Programs.Add(program);
            }

            program.Level = seed.Level;
            program.AnnualTuitionUsd = seed.Tuition;
            program.DurationMonths = seed.DurationMonths;
            program.MatchScore = seed.MatchScore;
            program.Tags = seed.Tags;
            await context.SaveChangesAsync();
        }
    }

    private sealed record Seed(
        string CountryCode,
        string CountryName,
        string CountryDescription,
        bool IsFeatured,
        string UniversityName,
        string City,
        string ProgramName,
        string Level,
        decimal Tuition,
        int DurationMonths,
        int MatchScore,
        string Tags);
}
