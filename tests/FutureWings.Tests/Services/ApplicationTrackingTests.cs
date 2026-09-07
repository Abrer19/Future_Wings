using System.ComponentModel.DataAnnotations;
using FutureWings.Application.DTOs.Application;
using FutureWings.Infrastructure.Data;
using FutureWings.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Tests.Services;

public sealed class ApplicationTrackingTests
{
    [Fact]
    public void Controller_RequiresAuthentication() =>
        Assert.NotNull(Attribute.GetCustomAttribute(typeof(ApplicationController), typeof(AuthorizeAttribute)));

    [Fact]
    public void CreateRequest_RejectsMissingProgram()
    {
        var request = new ApplicationCreateDto();
        var results = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), results, true));
    }

    [Fact]
    public void DatabaseModel_PreventsDuplicateTrackedPrograms()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>().UseSqlServer("Server=(local);Database=test").Options;
        using var context = new FutureWingsDbContext(options);
        var entity = context.Model.FindEntityType(typeof(FutureWings.Domain.Entities.Application))!;
        Assert.Contains(entity.GetIndexes(), index => index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual(["UserId", "ProgramId"]));
    }
}
