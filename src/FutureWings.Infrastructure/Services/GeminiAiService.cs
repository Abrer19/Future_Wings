using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace FutureWings.Infrastructure.Services;

public class GeminiAiService(HttpClient httpClient, IConfiguration configuration)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient = httpClient;
    private readonly IConfiguration _configuration = configuration;

    public async Task<IReadOnlyList<string>> GetUniversityRecommendationsAsync(string studentProfile)
    {
        var prompt = """
            You are a study-abroad advisor. Return only a JSON array of 5 concise university or program recommendations.
            Each item should be a single sentence naming the university/program and the reason it fits.

            Student profile:
            """ + Environment.NewLine + studentProfile;

        var text = await GenerateTextAsync(prompt, responseMimeType: "application/json", maxOutputTokens: 700);
        var normalized = StripCodeFence(text);

        try
        {
            var parsed = JsonSerializer.Deserialize<List<string>>(normalized, JsonOptions);
            return parsed?.Where(item => !string.IsNullOrWhiteSpace(item)).Select(item => item.Trim()).ToList() ?? [];
        }
        catch (JsonException)
        {
            return normalized
                .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(line => line.TrimStart('-', '*', ' ', '\t'))
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .Take(5)
                .ToList();
        }
    }

    public async Task<decimal> GetVisaRiskScoreAsync(string applicationDetails)
    {
        var prompt = """
            Estimate visa application risk from 0.00 to 1.00, where 0.00 means very low risk and 1.00 means very high risk.
            Return only the numeric decimal value with no explanation.

            Application details:
            """ + Environment.NewLine + applicationDetails;

        var text = StripCodeFence(await GenerateTextAsync(prompt, maxOutputTokens: 20, temperature: 0.2m));
        var numericText = new string(text.Where(character => char.IsDigit(character) || character == '.').ToArray());

        if (!decimal.TryParse(numericText, NumberStyles.Number, CultureInfo.InvariantCulture, out var score))
        {
            throw new InvalidOperationException("Gemini did not return a numeric visa risk score.");
        }

        return Math.Clamp(score, 0m, 1m);
    }

    public Task<string> GetChatbotResponseAsync(string message) =>
        GenerateTextAsync(
            "You are FutureWings, a helpful study-abroad planning assistant. Keep answers practical and concise." +
            Environment.NewLine + Environment.NewLine + message,
            maxOutputTokens: 900);

    private async Task<string> GenerateTextAsync(
        string prompt,
        string? responseMimeType = null,
        int maxOutputTokens = 800,
        decimal temperature = 0.7m)
    {
        var apiKey = GetRequiredSetting("GeminiApi:Key");
        var model = _configuration["GeminiApi:Model"];
        if (string.IsNullOrWhiteSpace(model) || model.StartsWith("replace-with", StringComparison.OrdinalIgnoreCase))
        {
            model = "gemini-2.0-flash";
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, BuildGenerateContentUri(model));
        request.Headers.Add("x-goog-api-key", apiKey);
        request.Content = JsonContent.Create(new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = prompt } }
                }
            },
            generationConfig = new
            {
                temperature,
                maxOutputTokens,
                responseMimeType
            }
        }, options: JsonOptions);

        using var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Gemini request failed with {(int)response.StatusCode}: {body}");
        }

        return ExtractText(body);
    }

    private Uri BuildGenerateContentUri(string model)
    {
        var baseUrl = _configuration["GeminiApi:BaseUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            baseUrl = "https://generativelanguage.googleapis.com/v1beta/";
        }

        var normalizedBase = baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/";
        var normalizedModel = model.StartsWith("models/", StringComparison.OrdinalIgnoreCase) ? model : $"models/{model}";
        return new Uri(new Uri(normalizedBase), $"{normalizedModel}:generateContent");
    }

    private string GetRequiredSetting(string key)
    {
        var value = _configuration[key];
        if (string.IsNullOrWhiteSpace(value) || value.StartsWith("replace-with", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"{key} is not configured.");
        }

        return value;
    }

    private static string ExtractText(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);
        var candidates = document.RootElement.GetProperty("candidates");
        foreach (var candidate in candidates.EnumerateArray())
        {
            if (!candidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts))
            {
                continue;
            }

            var text = string.Join(string.Empty, parts.EnumerateArray()
                .Where(part => part.TryGetProperty("text", out _))
                .Select(part => part.GetProperty("text").GetString()));

            if (!string.IsNullOrWhiteSpace(text)) return text.Trim();
        }

        throw new InvalidOperationException("Gemini response did not include text content.");
    }

    private static string StripCodeFence(string value)
    {
        var trimmed = value.Trim();
        if (!trimmed.StartsWith("```", StringComparison.Ordinal)) return trimmed;

        var firstLineEnd = trimmed.IndexOf('\n');
        if (firstLineEnd < 0) return trimmed.Trim('`').Trim();

        var withoutOpening = trimmed[(firstLineEnd + 1)..];
        var closingFence = withoutOpening.LastIndexOf("```", StringComparison.Ordinal);
        return (closingFence >= 0 ? withoutOpening[..closingFence] : withoutOpening).Trim();
    }
}
