# Issue 3: Add Timeout And Retry Policy

Make Gemini calls resilient to transient network/API failures.

Acceptance criteria:
- Configure a sensible timeout for the Gemini `HttpClient`.
- Retry only transient failures such as 429, 500, 502, 503, and 504.
- Surface final failures as clear application errors.
