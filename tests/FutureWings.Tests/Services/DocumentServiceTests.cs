using FutureWings.Application.DTOs.Document;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;

namespace FutureWings.Tests.Services;

public class DocumentServiceTests
{
    [Fact]
    public async Task UploadAndListDocuments_WorksForUser()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        var doc = await service.UploadAsync(1, new DocumentUploadDto
        {
            FileName = "passport.pdf",
            ContentType = "application/pdf",
            Content = [1, 2, 3, 4]
        });

        Assert.True(doc.Id > 0);

        var userDocs = await service.GetAllAsync(1);
        Assert.Single(userDocs);
        Assert.Equal("passport.pdf", userDocs[0].FileName);
    }

    [Fact]
    public async Task DeleteAsync_DeletesDocumentOwnedByUser()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        var doc = await service.UploadAsync(1, new DocumentUploadDto
        {
            FileName = "ielts_score.pdf",
            ContentType = "application/pdf",
            Content = [10, 20, 30]
        });
        await service.DeleteAsync(1, doc.Id);

        var userDocs = await service.GetAllAsync(1);
        Assert.Empty(userDocs);
    }
}
