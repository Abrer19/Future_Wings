using FutureWings.Application.DTOs.Document;

namespace FutureWings.Application.Interfaces;

public interface IDocumentService
{
    Task<int> UploadAsync(int userId, DocumentUploadDto request);
}
