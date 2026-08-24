using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options);
