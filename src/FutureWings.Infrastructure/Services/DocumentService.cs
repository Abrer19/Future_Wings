using FutureWings.Application.DTOs.Document;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutureWings.Infrastructure.Services;

public sealed class DocumentService(FutureWingsDbContext context) : IDocumentService
{
    private const int MaxFileBytes = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf", "image/jpeg", "image/png",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    private static readonly string StorageRoot = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "documents");

    public async Task<DocumentDto> UploadAsync(int userId, DocumentUploadDto request)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId)) throw new KeyNotFoundException("User not found.");
        if (request.Content.Length is 0 or > MaxFileBytes) throw new ArgumentException("File must be between 1 byte and 10 MB.");
        if (!AllowedTypes.Contains(request.ContentType)) throw new ArgumentException("Only PDF, Word, JPEG, and PNG files are supported.");

        var safeName = Path.GetFileName(request.FileName);
        if (string.IsNullOrWhiteSpace(safeName)) throw new ArgumentException("A valid file name is required.");
        Directory.CreateDirectory(StorageRoot);
        var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(safeName).ToLowerInvariant()}";
        var fullPath = Path.Combine(StorageRoot, storedName);
        await File.WriteAllBytesAsync(fullPath, request.Content);

        var document = new Document
        {
            UserId = userId, FileName = safeName, FilePath = storedName,
            ContentType = request.ContentType, SizeBytes = request.Content.LongLength, UploadedAt = DateTimeOffset.UtcNow,
        };
        try
        {
            context.Documents.Add(document);
            await context.SaveChangesAsync();
        }
        catch
        {
            File.Delete(fullPath);
            throw;
        }
        return ToDto(document);
    }

    public async Task<IReadOnlyList<DocumentDto>> GetAllAsync(int userId) =>
        await context.Documents.AsNoTracking().Where(item => item.UserId == userId)
            .OrderByDescending(item => item.UploadedAt).Select(item => new DocumentDto
            {
                Id = item.Id, FileName = item.FileName, ContentType = item.ContentType,
                SizeBytes = item.SizeBytes, UploadedAt = item.UploadedAt,
            }).ToListAsync();

    public async Task<DocumentDownloadDto> DownloadAsync(int userId, int documentId)
    {
        var document = await OwnedDocument(userId, documentId);
        var fullPath = Path.Combine(StorageRoot, document.FilePath);
        if (!File.Exists(fullPath)) throw new FileNotFoundException("The stored document file is missing.");
        return new DocumentDownloadDto { FileName = document.FileName, ContentType = document.ContentType, Content = await File.ReadAllBytesAsync(fullPath) };
    }

    public async Task DeleteAsync(int userId, int documentId)
    {
        var document = await OwnedDocument(userId, documentId);
        context.Documents.Remove(document);
        await context.SaveChangesAsync();
        var fullPath = Path.Combine(StorageRoot, document.FilePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    private async Task<Document> OwnedDocument(int userId, int documentId) =>
        await context.Documents.SingleOrDefaultAsync(item => item.Id == documentId && item.UserId == userId)
        ?? throw new KeyNotFoundException("Document not found.");

    private static DocumentDto ToDto(Document item) => new()
    {
        Id = item.Id, FileName = item.FileName, ContentType = item.ContentType,
        SizeBytes = item.SizeBytes, UploadedAt = item.UploadedAt,
    };
}
