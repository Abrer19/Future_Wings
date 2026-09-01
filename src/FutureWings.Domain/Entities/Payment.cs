namespace FutureWings.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    /// Stripe checkout-session or invoice id, so a payment can be traced back.
    public string? Reference { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
