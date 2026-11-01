using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.SqlServer.Infrastructure.Internal;

namespace FutureWings.Tests;

#pragma warning disable EF1001 // Internal EF Core API used for options inspection

public class DatabaseConfigurationTests
{
    [Fact]
    public void SqlServer_EnableRetryOnFailure_ConfiguresExecutionStrategy()
    {
        var optionsBuilder = new DbContextOptionsBuilder<FutureWingsDbContext>();
        optionsBuilder.UseSqlServer("Server=tcp:test.database.windows.net,1433;Database=testdb;", sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });

        var extension = optionsBuilder.Options.FindExtension<SqlServerOptionsExtension>();
        Assert.NotNull(extension);
        Assert.NotNull(extension.ExecutionStrategyFactory);
    }
}
#pragma warning restore EF1001
