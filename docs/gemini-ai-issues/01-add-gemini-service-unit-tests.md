# Issue 1: Add Gemini Service Unit Tests

Cover the Gemini REST client without calling the live API.

Acceptance criteria:
- Mock `HttpMessageHandler` returns representative Gemini responses.
- Tests cover recommendation parsing, visa score parsing, and chatbot text extraction.
- Tests cover malformed or empty Gemini responses.
