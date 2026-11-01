namespace FutureWings.Domain.Entities;

public class ProcessedWebhookEvent
{
    public int Id { get; set; }
    public string StripeEventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; set; }
}
