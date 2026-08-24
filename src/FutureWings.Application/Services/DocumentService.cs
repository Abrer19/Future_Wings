using FutureWings.Application.DTOs.Document;
using FutureWings.Application.Interfaces;

namespace FutureWings.Application.Services;

public class DocumentService : IDocumentService
{
    public Task<int> UploadAsync(int userId, DocumentUploadDto request) => Task.FromResult(1);
}
