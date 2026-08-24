using FutureWings.Application.DTOs.Document;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentController(IDocumentService documentService) : ControllerBase
{
    [HttpPost("user/{userId:int}")]
    public async Task<IActionResult> Upload(int userId, DocumentUploadDto request) =>
        Ok(new { DocumentId = await documentService.UploadAsync(userId, request) });
}
