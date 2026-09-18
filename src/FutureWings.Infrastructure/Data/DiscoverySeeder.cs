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
            // === UNITED STATES ===
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Stanford University", "Stanford, CA", "MS Computer Science (AI Track)", "Master's", 58000m, 24, 98, "Top Tier,AI & Robotics,Silicon Valley Hub"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Stanford University", "Stanford, CA", "BS Symbolic Systems", "Bachelor's", 62000m, 48, 95, "Interdisciplinary,Cognitive AI,Silicon Valley Hub"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Massachusetts Institute of Technology", "Cambridge, MA", "Master of Engineering in EECS", "Master's", 59000m, 24, 99, "World #1,Cutting-edge Research,STEM Designated"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Massachusetts Institute of Technology", "Cambridge, MA", "PhD in Artificial Intelligence", "Doctorate", 0m, 48, 97, "Fully Funded,Fellowship,Top Research"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "University of California, Berkeley", "Berkeley, CA", "Master of Information and Data Science", "Master's", 44000m, 20, 96, "Data Science,Big Data,Bay Area Network"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "University of California, Berkeley", "Berkeley, CA", "BS Electrical Engineering & Computer Science", "Bachelor's", 48000m, 48, 94, "Top Public Ivy,High Starting Salary,Silicon Valley"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Carnegie Mellon University", "Pittsburgh, PA", "MS in Software Engineering", "Master's", 52000m, 16, 97, "Top SE Program,Industry Capstone,STEM"),
            new Seed("US", "United States", "Global tech leader with 3-year STEM OPT work extensions", true,
                "Carnegie Mellon University", "Pittsburgh, PA", "MS in Robotics", "Master's", 54000m, 24, 96, "Robotics Institute,Autonomous Systems,Research"),

            // === CANADA ===
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Toronto", "Toronto, ON", "MSc Computer Science", "Master's", 31000m, 24, 96, "AI & Data,Vector Institute,Co-op Available"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Toronto", "Toronto, ON", "BSc Computer Science (Co-op)", "Bachelor's", 42000m, 48, 94, "Paid Internships,Downtown Tech Hub,PGWP Eligible"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of British Columbia", "Vancouver, BC", "Master of Data Science", "Master's", 36000m, 12, 93, "Accelerated,Industry Capstone,Coastal Tech"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of British Columbia", "Vancouver, BC", "BSc Cognitive Systems", "Bachelor's", 38000m, 48, 90, "AI & Psychology,Vancouver Tech,Research"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Waterloo", "Waterloo, ON", "Bachelor of Software Engineering (Co-op)", "Bachelor's", 45000m, 60, 97, "World Renowned Co-op,Silicon Valley Feeder,High ROI"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "University of Waterloo", "Waterloo, ON", "Master of Mathematics in Computer Science", "Master's", 28000m, 24, 95, "Strong Math Core,Research Grant,High Employment"),
            new Seed("CA", "Canada", "Welcoming immigration pathways and Post-Graduation Work Permits (PGWP)", true,
                "McGill University", "Montreal, QC", "MSc Computer Science (Mila AI)", "Master's", 26000m, 24, 92, "Deep Learning,Mila Institute,Bilingual City"),

            // === UNITED KINGDOM ===
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Oxford", "Oxford", "MSc in Advanced Computer Science", "Master's", 42000m, 12, 97, "Historic Prestige,1-Year Degree,High Career Impact"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Cambridge", "Cambridge", "MPhil in Machine Learning and Machine Intelligence", "Master's", 46000m, 12, 98, "Silicon Fen,Top ML Faculty,Prestigious"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "Imperial College London", "London", "MSc Computing (Artificial Intelligence)", "Master's", 45000m, 12, 95, "Central London,Tech Unicorns,High Employability"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Manchester", "Manchester", "MSc Data Science", "Master's", 38000m, 12, 88, "One-Year Degree,Industrial Advisory,Career Support"),
            new Seed("GB", "United Kingdom", "World-renowned 1-year Master's and 2-year Graduate Route visas", true,
                "University of Edinburgh", "Edinburgh", "MSc Artificial Intelligence", "Master's", 39000m, 12, 91, "Oldest AI Group in UK,Research Excellence,Bayes Centre"),

            // === GERMANY ===
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Technical University of Munich", "Munich", "MSc Informatics", "Master's", 6500m, 24, 94, "Top in Germany,Industry Powerhouse,Bavarian Tech"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Technical University of Munich", "Munich", "MSc Data Engineering and Analytics", "Master's", 6500m, 24, 93, "Big Data,Cloud Architectures,English Taught"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "RWTH Aachen University", "Aachen", "MSc Computer Engineering", "Master's", 800m, 24, 90, "Nearly Free Tuition,Excellence University,Automotive Tech"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Technical University of Berlin", "Berlin", "MSc Computer Science (English Taught)", "Master's", 800m, 24, 91, "Startup Capital Berlin,Low Cost,English Taught"),
            new Seed("DE", "Germany", "Affordable public universities with 18-month post-study job seeker visas", true,
                "Heidelberg University", "Heidelberg", "MSc Scientific Computing", "Master's", 3200m, 24, 88, "Germany Oldest University,Biotech,High Performance Computing"),

            // === AUSTRALIA ===
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of Melbourne", "Melbourne, VIC", "Master of Information Technology", "Master's", 34000m, 24, 89, "Melbourne Connect,Industry Projects,Global Network"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of Melbourne", "Melbourne, VIC", "Master of Data Science", "Master's", 36000m, 24, 88, "Statistical Modeling,Industry Capstone,High Demand"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of Sydney", "Sydney, NSW", "Master of Cybersecurity", "Master's", 35000m, 24, 87, "Cyber Defense,Global City,Extended Work Visa"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "University of New South Wales", "Sydney, NSW", "Master of Information Technology (AI Track)", "Master's", 35000m, 24, 89, "Group of Eight,Robotics Lab,Fintech"),
            new Seed("AU", "Australia", "High quality of life with extended post-study work rights", true,
                "Australian National University", "Canberra, ACT", "Master of Computing (Artificial Intelligence)", "Master's", 33000m, 24, 88, "National Research Capital,CSIRO Collaboration,Top Rank"),

            // === NETHERLANDS ===
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "University of Amsterdam", "Amsterdam", "MSc Artificial Intelligence", "Master's", 18500m, 24, 92, "Amsterdam Science Park,Deep Learning,English Taught"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "University of Amsterdam", "Amsterdam", "BSc Business Analytics", "Bachelor's", 14200m, 36, 86, "English Taught,Fintech,International Community"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "Delft University of Technology", "Delft", "MSc Computer Science (Software Tech)", "Master's", 19000m, 24, 93, "Top Tech University,Quantum & AI,High Graduate Salaries"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "Delft University of Technology", "Delft", "MSc Robotics", "Master's", 19500m, 24, 92, "RoboValley,Mechatronics,High Employability"),
            new Seed("NL", "Netherlands", "Continental Europe's premier English-taught degree hub", true,
                "Eindhoven University of Technology", "Eindhoven", "MSc Data Science and AI", "Master's", 17000m, 24, 89, "Brainport Region,ASML & Philips Network,Tech Hub"),

            // === SWEDEN ===
            new Seed("SE", "Sweden", "Leader in green innovation, sustainability, and English-taught Master's", true,
                "KTH Royal Institute of Technology", "Stockholm", "MSc Machine Learning", "Master's", 16000m, 24, 91, "Stockholm Tech Unicorns,Spotify Hub,English Taught"),
            new Seed("SE", "Sweden", "Leader in green innovation, sustainability, and English-taught Master's", true,
                "KTH Royal Institute of Technology", "Stockholm", "MSc Software Engineering of Distributed Systems", "Master's", 16000m, 24, 89, "Cloud Systems,Cybersecurity,High Salaries"),
            new Seed("SE", "Sweden", "Leader in green innovation, sustainability, and English-taught Master's", true,
                "Chalmers University of Technology", "Gothenburg", "MSc Computer Science: Algorithms and Logic", "Master's", 15500m, 24, 88, "Automotive Tech (Volvo),AI Labs,High Quality of Life"),

            // === SWITZERLAND ===
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "ETH Zurich", "Zurich", "Master in Computer Science", "Master's", 1800m, 24, 98, "World Top 10,Google & Disney Research Labs,Ultra Low Tuition"),
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "ETH Zurich", "Zurich", "Master in Data Science", "Master's", 1800m, 24, 97, "Max Planck Institute Partner,Swiss Banking Tech,Top ROI"),
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "EPFL", "Lausanne", "MSc in Computer Science", "Master's", 1600m, 24, 96, "Lake Geneva Innovation Hub,Cybersecurity,Low Tuition"),
            new Seed("CH", "Switzerland", "World top-10 universities with very low tuition and highest graduate salaries", true,
                "EPFL", "Lausanne", "MSc in Robotics", "Master's", 1600m, 24, 95, "World Renowned Robotics,Swiss Tech,High Salaries"),

            // === SINGAPORE ===
            new Seed("SG", "Singapore", "Asia's premier financial and AI innovation gateway", false,
                "National University of Singapore", "Singapore", "Master of Computing (AI Specialisation)", "Master's", 38000m, 18, 96, "Asia #1,Global Financial Capital,Silicon Island"),
            new Seed("SG", "Singapore", "Asia's premier financial and AI innovation gateway", false,
                "National University of Singapore", "Singapore", "Bachelor of Computing in Computer Science", "Bachelor's", 29000m, 48, 95, "World Top 10 CS,Multinational HQs,High Salary"),
            new Seed("SG", "Singapore", "Asia's premier financial and AI innovation gateway", false,
                "Nanyang Technological University", "Singapore", "MSc in Artificial Intelligence", "Master's", 36000m, 12, 94, "Ranked #1 Young University,Smart Nation Projects,Fast Track"),

            // === JAPAN ===
            new Seed("JP", "Japan", "Pioneering robotics, engineering, and government MEXT scholarships", false,
                "The University of Tokyo", "Tokyo", "Master of Information Science and Technology", "Master's", 4800m, 24, 93, "Todai,Japan #1,English Program,Robotics Hub"),
            new Seed("JP", "Japan", "Pioneering robotics, engineering, and government MEXT scholarships", false,
                "Kyoto University", "Kyoto", "Master in Intelligence Science and Technology", "Master's", 4800m, 24, 91, "Nobel Laureates,AI & Cognitive Science,Historic City"),
            new Seed("JP", "Japan", "Pioneering robotics, engineering, and government MEXT scholarships", false,
                "Tokyo Institute of Technology", "Tokyo", "MSc in Artificial Intelligence Systems", "Master's", 4800m, 24, 90, "Supercomputing Hub,MEXT Scholarship Eligible,English Taught"),

            // === FRANCE ===
            new Seed("FR", "France", "Renowned Grandes Écoles and vibrant Paris tech startup ecosystem", false,
                "Institut Polytechnique de Paris", "Palaiseau, Paris", "MSc in AI and Advanced Visual Computing", "Master's", 14000m, 24, 92, "Station F Tech Hub,Elite Grande École,Top Salaries"),
            new Seed("FR", "France", "Renowned Grandes Écoles and vibrant Paris tech startup ecosystem", false,
                "Sorbonne University", "Paris", "Master in Computer Science (Quantum & AI)", "Master's", 3800m, 24, 90, "Historic Prestige,Public Tuition,European AI Hub"),

            // === IRELAND ===
            new Seed("IE", "Ireland", "European tech HQ capital with 2-year post-study graduate work visa", false,
                "Trinity College Dublin", "Dublin", "MSc Computer Science (Data Science)", "Master's", 24500m, 12, 90, "Silicon Docks,Google/Meta HQs,Fast-Track Degree"),
            new Seed("IE", "Ireland", "European tech HQ capital with 2-year post-study graduate work visa", false,
                "University College Dublin", "Dublin", "MSc Computer Science (Advanced)", "Master's", 23000m, 16, 88, "Industry Partnerships,Ireland Tech Hub,2-Year Stay Back"),

            // === FINLAND ===
            new Seed("FI", "Finland", "Top education ranking, highest happiness index, and generous scholarships", false,
                "Aalto University", "Espoo", "MSc Machine Learning, Data Science and AI", "Master's", 16400m, 24, 91, "Slush Startup Ecosystem,Top AI Labs,Scholarships Available"),
            new Seed("FI", "Finland", "Top education ranking, highest happiness index, and generous scholarships", false,
                "Aalto University", "Espoo", "MSc Human-Computer Interaction", "Master's", 16400m, 24, 87, "Design & Tech,Full Scholarship Options,High Well-being"),
            new Seed("FI", "Finland", "Top education ranking, highest happiness index, and generous scholarships", false,
                "University of Helsinki", "Helsinki", "MSc Computer Science (Data Science Track)", "Master's", 15000m, 24, 89, "Birthplace of Linux,Elements of AI,Research Centered"),

            // === NEW ZEALAND ===
            new Seed("NZ", "New Zealand", "Safe, pristine environment with open post-study work permissions", false,
                "University of Auckland", "Auckland", "Master of Information Technology", "Master's", 29000m, 18, 87, "Auckland Tech Corridor,Post-Study Work Visa,Industry Internship"),
            new Seed("NZ", "New Zealand", "Safe, pristine environment with open post-study work permissions", false,
                "University of Otago", "Dunedin", "Master of Applied Science in Software Engineering", "Master's", 26000m, 12, 85, "Beautiful Campus,Supportive Community,Applied Projects")
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
                await context.SaveChangesAsync();
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
                await context.SaveChangesAsync();
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

        await SeedScholarshipsAsync(context);
        await SeedCommunityRatingsAsync(context);
    }

    private static async Task SeedScholarshipsAsync(FutureWingsDbContext context)
    {
        var scholarshipSeeds = new[]
        {
            ("US", "Fulbright Foreign Student Program"),
            ("US", "Knight-Hennessy Scholars at Stanford"),
            ("US", "Hubert H. Humphrey Fellowship"),
            ("CA", "Vanier Canada Graduate Scholarships"),
            ("CA", "Lester B. Pearson International Scholarship"),
            ("CA", "Ontario Graduate Scholarship (OGS)"),
            ("GB", "Chevening Scholarships for Global Leaders"),
            ("GB", "Commonwealth Masters Scholarships"),
            ("GB", "Rhodes Scholarships at Oxford"),
            ("DE", "DAAD Master Studies Scholarships"),
            ("DE", "Deutschlandstipendium National Merit Grant"),
            ("DE", "Heinrich Böll Foundation Research Grant"),
            ("AU", "Australia Awards Scholarships"),
            ("AU", "Melbourne International Research Scholarship"),
            ("AU", "Destination Australia Regional Scholarship"),
            ("NL", "NL Scholarship (Holland Scholarship)"),
            ("NL", "Amsterdam Merit Scholarship (AMS)"),
            ("NL", "Erasmus+ European Masters Grant"),
            ("SE", "Swedish Institute Scholarships for Global Professionals"),
            ("CH", "Swiss Government Excellence Scholarships"),
            ("CH", "ETH Zurich Excellence Scholarship (ESOP)"),
            ("SG", "Singapore International Graduate Award (SINGA)"),
            ("JP", "MEXT Japanese Government Research Scholarship"),
            ("FR", "Eiffel Excellence Scholarship Program"),
            ("IE", "Government of Ireland International Education Scholarship"),
            ("FI", "Finland Scholarship for Master's Degrees")
        };

        for (var index = 0; index < scholarshipSeeds.Length; index++)
        {
            var (countryCode, name) = scholarshipSeeds[index];
            var country = await context.Countries.SingleOrDefaultAsync(c => c.Code == countryCode);
            if (country is null) continue;

            var existing = await context.Scholarships.SingleOrDefaultAsync(s => s.Name == name && s.CountryId == country.Id);
            if (existing is null)
            {
                existing = new Scholarship
                {
                    Name = name,
                    CountryId = country.Id
                };
                context.Scholarships.Add(existing);
            }
            existing.EligibilityCriteria = "International applicants with strong academic achievement, leadership potential, and admission to an eligible program.";
            existing.AwardAmount = 10_000m + index % 6 * 5_000m;
            existing.Deadline = new DateTimeOffset(2027, 1 + index % 11, 15, 23, 59, 0, TimeSpan.Zero);
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedCommunityRatingsAsync(FutureWingsDbContext context)
    {
        // Check if demo user exists for ratings
        var demoUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "demo.reviewer@futurewings.io");
        if (demoUser is null)
        {
            demoUser = new User
            {
                Email = "demo.reviewer@futurewings.io",
                PasswordHash = "$2a$11$eDemoReviewerHashPlaceholderNotForDirectLogin99812",
                Role = "Student",
                SubscriptionTier = "Pro",
                HasSeededDeadlines = true
            };
            context.Users.Add(demoUser);
            await context.SaveChangesAsync();

            context.UserProfiles.Add(new UserProfile
            {
                UserId = demoUser.Id,
                FirstName = "Aria",
                LastName = "Chen",
                Major = "Computer Science",
                DegreeLevel = "Master's",
                Cgpa = 3.92m,
                BudgetUsd = 35000m
            });
            await context.SaveChangesAsync();
        }

        var reviewSeeds = new[]
        {
            ("University of Toronto", 5, "The Vector Institute affiliation and Toronto's tech scene are incredible. Co-op program landed me an internship in 4 months!"),
            ("Technical University of Munich", 5, "World-class engineering education and practically zero tuition. Munich's tech ecosystem with BMW and Siemens is unbeatable."),
            ("Stanford University", 5, "Access to Silicon Valley venture capital and top AI researchers is unparalleled. Best decision of my academic life."),
            ("ETH Zurich", 5, "Rigorous curriculum, cutting-edge labs, and Zurich is beautiful. High quality of life with extremely affordable semester fees."),
            ("University of Melbourne", 5, "Melbourne Connect is a fantastic innovation hub. Very supportive international student community and great career fairs."),
            ("University of Amsterdam", 4, "High quality English-taught AI program in the heart of Europe. Great student vibe and cycling culture."),
            ("KTH Royal Institute of Technology", 5, "Stockholm's tech startup scene (Spotify, Klarna) recruits directly on campus. Very collaborative professors."),
            ("Imperial College London", 5, "Intense 1-year Master's degree with immediate connections to London fintech and AI startups."),
            ("University of Waterloo", 5, "Co-op program is legendary. 6 internships during undergraduate degree with Silicon Valley tech giants."),
            ("National University of Singapore", 5, "Asia's absolute best tech campus. State-of-the-art facilities and massive recruitment from global multinationals.")
        };

        foreach (var (uniName, score, comment) in reviewSeeds)
        {
            var uni = await context.Universities.FirstOrDefaultAsync(u => u.Name == uniName);
            if (uni is null) continue;

            var existing = await context.Ratings.FirstOrDefaultAsync(r => r.UniversityId == uni.Id && r.UserId == demoUser.Id);
            if (existing is null)
            {
                context.Ratings.Add(new Rating
                {
                    UserId = demoUser.Id,
                    UniversityId = uni.Id,
                    Score = score,
                    Comment = comment
                });
            }
        }
        await context.SaveChangesAsync();
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

