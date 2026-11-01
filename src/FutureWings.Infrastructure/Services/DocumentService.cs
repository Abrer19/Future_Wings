using FutureWings.Application.DTOs.Document;
using FutureWings.Application.Interfaces;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Infrastructure.Services;

public sealed class DocumentService(
    FutureWingsDbContext context,
    IConfiguration? configuration = null) : IDocumentService
{
    private const int MaxFileBytes = 10 * 1024 * 1024;

    private static readonly Dictionary<string, (string[] ContentTypes, byte[][] Signatures)> AllowedFormatSignatures =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = (
                new[] { "application/pdf" },
                new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } } // %PDF
            ),
            [".png"] = (
                new[] { "image/png" },
                new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } }
            ),
            [".jpg"] = (
                new[] { "image/jpeg", "image/pjpeg" },
                new[] { new byte[] { 0xFF, 0xD8, 0xFF } }
            ),
            [".jpeg"] = (
                new[] { "image/jpeg", "image/pjpeg" },
                new[] { new byte[] { 0xFF, 0xD8, 0xFF } }
            ),
            [".doc"] = (
                new[] { "application/msword" },
                new[] { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } }
            ),
            [".docx"] = (
                new[] { "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
                new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } // PK.. (ZIP archive)
            ),
        };

    private string StorageRoot =>
        configuration?["DocumentStorage:Path"] ??
        configuration?["Storage:DocumentsPath"] ??
        Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "documents");

    public async Task<DocumentDto> UploadAsync(int userId, DocumentUploadDto request)
    {
        if (!await context.Users.AnyAsync(user => user.Id == userId))
            throw new KeyNotFoundException("User not found.");

        if (request.Content.Length is 0 or > MaxFileBytes)
            throw new ArgumentException("File must be between 1 byte and 10 MB.");

        // Guard against path traversal attempts in client file name
        if (string.IsNullOrWhiteSpace(request.FileName) ||
            request.FileName.Contains("..") ||
            request.FileName.Contains('/') ||
            request.FileName.Contains('\\'))
        {
            // Extract the base file name safely
            request.FileName = Path.GetFileName(request.FileName);
        }

        var safeName = Path.GetFileName(request.FileName);
        if (string.IsNullOrWhiteSpace(safeName))
            throw new ArgumentException("A valid file name is required.");

        var extension = Path.GetExtension(safeName).ToLowerInvariant();
        if (!AllowedFormatSignatures.TryGetValue(extension, out var formatRule))
        {
            throw new ArgumentException("Only PDF, Word, JPEG, and PNG files are supported.");
        }

        if (!formatRule.ContentTypes.Contains(request.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Uploaded content type does not match file extension.");
        }

        var hasValidSignature = formatRule.Signatures.Any(sig =>
            request.Content.Length >= sig.Length &&
            request.Content.AsSpan(0, sig.Length).SequenceEqual(sig));

        if (!hasValidSignature)
        {
            throw new ArgumentException("File content signature does not match expected format.");
        }

        var storageDir = StorageRoot;
        Directory.CreateDirectory(storageDir);

        var storedName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(storageDir, storedName);

        // Verify that the resolved target path is strictly within the allowed directory
        var canonicalTarget = Path.GetFullPath(fullPath);
        var canonicalStorage = Path.GetFullPath(storageDir);
        if (!canonicalTarget.StartsWith(canonicalStorage, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Invalid file destination path.");
        }

        await File.WriteAllBytesAsync(fullPath, request.Content);

        var document = new Document
        {
            UserId = userId,
            FileName = safeName,
            FilePath = storedName,
            ContentType = request.ContentType,
            SizeBytes = request.Content.LongLength,
            UploadedAt = DateTimeOffset.UtcNow,
        };

        try
        {
            context.Documents.Add(document);
            await context.SaveChangesAsync();
        }
        catch
        {
            if (File.Exists(fullPath))
            {
                try { File.Delete(fullPath); } catch { /* ignore on rollback */ }
            }
            throw;
        }

        return ToDto(document);
    }

    public async Task<IReadOnlyList<DocumentDto>> GetAllAsync(int userId) =>
        await context.Documents.AsNoTracking().Where(item => item.UserId == userId)
            .OrderByDescending(item => item.UploadedAt).Select(item => new DocumentDto
            {
                Id = item.Id,
                FileName = item.FileName,
                ContentType = item.ContentType,
                SizeBytes = item.SizeBytes,
                UploadedAt = item.UploadedAt,
            }).ToListAsync();

    public async Task<DocumentDownloadDto> DownloadAsync(int userId, int documentId)
    {
        var document = await OwnedDocument(userId, documentId);
        var fullPath = Path.Combine(StorageRoot, document.FilePath);
        if (!File.Exists(fullPath)) throw new FileNotFoundException("The stored document file is missing.");
        return new DocumentDownloadDto
        {
            FileName = document.FileName,
            ContentType = document.ContentType,
            Content = await File.ReadAllBytesAsync(fullPath)
        };
    }

    public async Task DeleteAsync(int userId, int documentId)
    {
        var document = await OwnedDocument(userId, documentId);
        var fullPath = Path.Combine(StorageRoot, document.FilePath);
        context.Documents.Remove(document);
        await context.SaveChangesAsync();

        if (File.Exists(fullPath))
        {
            try { File.Delete(fullPath); } catch { /* ignore */ }
        }
    }

    private async Task<Document> OwnedDocument(int userId, int documentId) =>
        await context.Documents.SingleOrDefaultAsync(item => item.Id == documentId && item.UserId == userId)
        ?? throw new KeyNotFoundException("Document not found.");

    private static DocumentDto ToDto(Document item) => new()
    {
        Id = item.Id,
        FileName = item.FileName,
        ContentType = item.ContentType,
        SizeBytes = item.SizeBytes,
        UploadedAt = item.UploadedAt,
    };
}
