# Issue 7: Add Usage Logging

Track Gemini usage for observability and cost control.

Acceptance criteria:
- Log model name, endpoint, success/failure, latency, and token usage when available.
- Do not log API keys or sensitive prompt content.
- Failed calls include status code and safe error details.
