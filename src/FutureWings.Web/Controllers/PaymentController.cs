using System.Security.Claims;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentController(IPaymentService paymentService) : ControllerBase
{
    [HttpPost("subscription")]
    public async Task<IActionResult> CreateSubscription([FromQuery] string priceId) =>
        Ok(new { SubscriptionId = await paymentService.CreateSubscriptionAsync(GetUserId(), priceId) });

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
