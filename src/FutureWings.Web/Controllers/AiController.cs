using FutureWings.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/ai")]
public sealed class AiController(GeminiAiService geminiAiService) : ControllerBase
{
    [HttpPost("chat")]
    public async Task<IActionResult> Chat(ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Message is required." });
        }

        try
        {
            var reply = await geminiAiService.GetChatbotResponseAsync(request.Message.Trim());
            return Ok(new ChatResponse(reply));
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
    }

    public sealed record ChatRequest(string Message);
    public sealed record ChatResponse(string Reply);
}
