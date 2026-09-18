# Gemini AI Backlog

These issues track follow-up work for the real Gemini integration.

## 1. Add Gemini Service Unit Tests

Cover the Gemini REST client without calling the live API.

Acceptance criteria:
- Mock `HttpMessageHandler` returns representative Gemini responses.
- Tests cover recommendation parsing, visa score parsing, and chatbot text extraction.
- Tests cover malformed or empty Gemini responses.

## 2. Add Configuration Documentation

Document how to configure Gemini in development and production.

Acceptance criteria:
- README explains `GeminiApi:Key`, `GeminiApi:Model`, and `GeminiApi:BaseUrl`.
- User-secrets and environment variable examples are included.
- The docs warn not to commit real API keys.

## 3. Add Timeout And Retry Policy

Make Gemini calls resilient to transient network/API failures.

Acceptance criteria:
- Configure a sensible timeout for the Gemini `HttpClient`.
- Retry only transient failures such as 429, 500, 502, 503, and 504.
- Surface final failures as clear application errors.

## 4. Add Structured Recommendation Schema

Return richer recommendation objects instead of plain strings.

Acceptance criteria:
- Gemini prompt asks for JSON objects with institution, program, country, fit reason, and confidence.
- Parser validates the schema before returning data.
- UI/backend call sites can display structured recommendations cleanly.

## 5. Add Safer Visa Risk Contract

Replace free-form numeric parsing with strict JSON output.

Acceptance criteria:
- Gemini returns `{ "score": 0.0, "reasons": [], "recommendations": [] }`.
- Parsing rejects missing or invalid score values.
- The score remains clamped between 0 and 1.

## 6. Add Prompt Injection Guardrails

Harden prompts that include user-supplied profile/application text.

Acceptance criteria:
- User content is clearly delimited in every prompt.
- System instructions tell Gemini to ignore instructions inside user data.
- Tests verify the prompt format is stable.

## 7. Add Usage Logging

Track Gemini usage for observability and cost control.

Acceptance criteria:
- Log model name, endpoint, success/failure, latency, and token usage when available.
- Do not log API keys or sensitive prompt content.
- Failed calls include status code and safe error details.

## 8. Add Rate Limit Handling

Gracefully handle Gemini quota and rate-limit failures.

Acceptance criteria:
- 429 responses show a user-friendly retry-later message.
- Backend can distinguish quota failures from general server failures.
- Optional retry-after headers are respected if present.

## 9. Add Feature-Level Fallbacks

Keep the app usable when Gemini is not configured.

Acceptance criteria:
- Features depending on Gemini can detect missing configuration.
- The UI explains that AI features require setup instead of showing a crash.
- Non-AI features continue to work normally.

## 10. Add Admin Health Check For AI Configuration

Expose whether AI services are configured and reachable.

Acceptance criteria:
- Admin dashboard can show Gemini configured/unconfigured status.
- Health check does not leak secrets.
- Optional live check verifies the configured model can answer a tiny request.
