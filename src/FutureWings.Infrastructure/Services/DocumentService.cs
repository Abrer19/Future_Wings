using FutureWings.Application.DTOs.Document;
using FutureWings.Application.Interfaces;

namespace FutureWings.Infrastructure.Services;

/// <summary>
/// STUB: not implemented. Always returns document id 1; no file is stored and no Documents row is written.
/// <para>
/// Lives here rather than in the Application layer because concrete implementations
/// belong in Infrastructure; the contract stays in Application/Interfaces/IDocumentService.cs.
/// Replace this class with a real implementation - do not build on its return values.
/// </para>
/// </summary>
public class DocumentService : IDocumentService
{
    public Task<int> UploadAsync(int userId, DocumentUploadDto request) => Task.FromResult(1);
}
