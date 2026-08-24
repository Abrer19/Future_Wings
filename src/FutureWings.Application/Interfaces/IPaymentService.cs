namespace FutureWings.Application.Interfaces;

public interface IPaymentService
{
    Task<string> CreateSubscriptionAsync(int userId, string priceId);
}
