using System.ComponentModel.DataAnnotations;
using FutureWings.Application.DTOs.Document;
using FutureWings.Infrastructure.Data;
using FutureWings.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Tests.Services;

public sealed class DocumentUploadTests
{
    [Fact]
    public void Controller_RequiresAuthentication() =>
        Assert.NotNull(Attribute.GetCustomAttribute(typeof(DocumentController), typeof(AuthorizeAttribute)));

    [Fact]
    public void UploadRequest_RequiresFileMetadataAndContent()
    {
        var request = new DocumentUploadDto();
        var results = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), results, true));
        Assert.Equal(2, results.Count);
        Assert.Empty(request.Content);
    }

    [Fact]
    public void DatabaseModel_ConstrainsStoredDocumentMetadata()
    {
        var options = new DbContextOptionsBuilder<FutureWingsDbContext>().UseSqlServer("Server=(local);Database=test").Options;
        using var context = new FutureWingsDbContext(options);
        var entity = context.Model.FindEntityType(typeof(FutureWings.Domain.Entities.Document))!;
        Assert.Equal(255, entity.FindProperty("FileName")!.GetMaxLength());
        Assert.Equal(500, entity.FindProperty("FilePath")!.GetMaxLength());
        Assert.Equal(100, entity.FindProperty("ContentType")!.GetMaxLength());
    }
}
