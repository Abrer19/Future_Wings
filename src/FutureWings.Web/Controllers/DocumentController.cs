using System.Security.Claims;
using FutureWings.Application.DTOs.Document;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

public class DocumentUploadForm
{
    public IFormFile File { get; set; } = null!;
}

[Authorize]
[ApiController]
[Route("api/documents")]
public class DocumentController(IDocumentService documentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await documentService.GetAllAsync(GetUserId()));

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] DocumentUploadForm form)
    {
        var file = form.File;
        if (file == null || file.Length == 0) return BadRequest(new { Message = "Choose a non-empty file." });
        if (file.Length > 10 * 1024 * 1024) return BadRequest(new { Message = "File exceeds maximum size of 10 MB." });

        try
        {
            await using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            var result = await documentService.UploadAsync(GetUserId(), new DocumentUploadDto
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                Content = stream.ToArray(),
            });
            return CreatedAtAction(nameof(Download), new { documentId = result.Id }, result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{documentId:int}/download")]
    public async Task<IActionResult> Download(int documentId)
    {
        try
        {
            var document = await documentService.DownloadAsync(GetUserId(), documentId);
            Response.Headers.Append("X-Content-Type-Options", "nosniff");
            return File(document.Content, document.ContentType, document.FileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "The stored file could not be found." });
        }
    }

    [HttpDelete("{documentId:int}")]
    public async Task<IActionResult> Delete(int documentId)
    {
        try
        {
            await documentService.DeleteAsync(GetUserId(), documentId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
