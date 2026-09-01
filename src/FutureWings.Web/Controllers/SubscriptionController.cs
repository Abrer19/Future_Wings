using System.Security.Claims;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SubscriptionController(ISubscriptionService subscriptionService) : ControllerBase
{
    /// Public pricing information — no account needed to see what the plans cost.
    [AllowAnonymous]
    [HttpGet("plans")]
    public IActionResult GetPlans() => Ok(subscriptionService.GetPlans());

    /// The caller's own tier and feature entitlements.
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        try
        {
            return Ok(await subscriptionService.GetStatusAsync(GetUserId()));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout(CheckoutRequest request)
    {
        try
        {
            var origin = $"{Request.Scheme}://{Request.Host}";
            var returnUrl = string.IsNullOrWhiteSpace(request.ReturnUrl) ? origin : request.ReturnUrl;
            return Ok(await subscriptionService.CreateCheckoutSessionAsync(GetUserId(), request.Tier, returnUrl));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException exception)
        {
            // Stripe keys or price ids missing: the feature is unavailable rather than broken.
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
    }

    /// <summary>
    /// Stripe calls this. Anonymous by necessity — Stripe has no bearer token — but the
    /// payload signature is verified against Stripe:WebhookSecret before anything is
    /// applied, so an unsigned request can never grant a tier.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            var applied = await subscriptionService.ApplyWebhookAsync(payload, signature);
            return Ok(new { applied });
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
        catch (Stripe.StripeException)
        {
            // Signature verification failed.
            return BadRequest(new { message = "Invalid Stripe signature." });
        }
    }

    private int GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("The authenticated user identifier is invalid.");
    }

    public sealed record CheckoutRequest(string Tier, string? ReturnUrl);
}
