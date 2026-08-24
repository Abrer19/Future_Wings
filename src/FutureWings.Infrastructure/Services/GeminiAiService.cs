namespace FutureWings.Infrastructure.Services;

public class GeminiAiService(HttpClient httpClient)
{
    private readonly HttpClient _httpClient = httpClient;

    public Task<IReadOnlyList<string>> GetUniversityRecommendationsAsync(string studentProfile)
    {
        _ = _httpClient;
        IReadOnlyList<string> recommendations =
        [
            "Placeholder University Recommendation"
        ];

        return Task.FromResult(recommendations);
    }

    public Task<decimal> GetVisaRiskScoreAsync(string applicationDetails)
    {
        _ = _httpClient;
        return Task.FromResult(0.5m);
    }

    public Task<string> GetChatbotResponseAsync(string message)
    {
        _ = _httpClient;
        return Task.FromResult("This is a placeholder chatbot response.");
    }
}
