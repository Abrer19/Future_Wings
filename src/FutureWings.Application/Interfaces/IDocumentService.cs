using FutureWings.Application.DTOs.Document;

namespace FutureWings.Application.Interfaces;

public interface IDocumentService
{
    Task<DocumentDto> UploadAsync(int userId, DocumentUploadDto request);
    Task<IReadOnlyList<DocumentDto>> GetAllAsync(int userId);
    Task<DocumentDownloadDto> DownloadAsync(int userId, int documentId);
    Task DeleteAsync(int userId, int documentId);
}
