using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController(IPaymentService paymentService) : ControllerBase
{
    [HttpPost("subscription")]
    public async Task<IActionResult> CreateSubscription(int userId, string priceId) =>
        Ok(new { SubscriptionId = await paymentService.CreateSubscriptionAsync(userId, priceId) });
}
