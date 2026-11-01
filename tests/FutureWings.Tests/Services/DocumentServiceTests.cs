using FutureWings.Application.DTOs.Document;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Tests.Services;

public class DocumentServiceTests
{
    private static readonly byte[] ValidPdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]; // %PDF-1.4
    private static readonly byte[] ValidPngBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];
    private static readonly byte[] ValidJpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];

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
            Content = ValidPdfBytes
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
            Content = ValidPdfBytes
        });
        await service.DeleteAsync(1, doc.Id);

        var userDocs = await service.GetAllAsync(1);
        Assert.Empty(userDocs);
    }

    [Fact]
    public async Task UploadAsync_MimeSpoofing_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        // Extension says .pdf, but ContentType says image/png
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UploadAsync(1, new DocumentUploadDto
            {
                FileName = "spoofed.pdf",
                ContentType = "image/png",
                Content = ValidPngBytes
            }));
    }

    [Fact]
    public async Task UploadAsync_InvalidSignature_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        // ContentType is application/pdf, but bytes are plain invalid text
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UploadAsync(1, new DocumentUploadDto
            {
                FileName = "malicious.pdf",
                ContentType = "application/pdf",
                Content = [0x41, 0x42, 0x43, 0x44] // ABCD
            }));
    }

    [Fact]
    public async Task UploadAsync_OversizedFile_ThrowsArgumentException()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        // Exceeds 10 MB limit (10MB + 1 byte)
        var oversized = new byte[10 * 1024 * 1024 + 1];
        Buffer.BlockCopy(ValidPdfBytes, 0, oversized, 0, ValidPdfBytes.Length);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UploadAsync(1, new DocumentUploadDto
            {
                FileName = "huge.pdf",
                ContentType = "application/pdf",
                Content = oversized
            }));
    }

    [Fact]
    public async Task UploadAsync_PathTraversalInFileName_SanitizesFileNameAndStoresSafely()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        var doc = await service.UploadAsync(1, new DocumentUploadDto
        {
            FileName = "../../../etc/passwd.pdf",
            ContentType = "application/pdf",
            Content = ValidPdfBytes
        });

        Assert.Equal("passwd.pdf", doc.FileName);
    }

    [Fact]
    public async Task DownloadAsync_OwnershipIsolation_ThrowsKeyNotFoundException()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = 1, Email = "student1@test.com" });
        context.Users.Add(new User { Id = 2, Email = "student2@test.com" });
        context.SaveChanges();

        var service = new DocumentService(context);

        var doc = await service.UploadAsync(1, new DocumentUploadDto
        {
            FileName = "private.pdf",
            ContentType = "application/pdf",
            Content = ValidPdfBytes
        });

        // User 2 cannot download User 1's document
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.DownloadAsync(2, doc.Id));

        // User 2 cannot delete User 1's document
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.DeleteAsync(2, doc.Id));
    }
}
