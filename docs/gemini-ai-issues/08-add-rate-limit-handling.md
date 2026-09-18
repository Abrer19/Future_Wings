# Issue 8: Add Rate Limit Handling

Gracefully handle Gemini quota and rate-limit failures.

Acceptance criteria:
- 429 responses show a user-friendly retry-later message.
- Backend can distinguish quota failures from general server failures.
- Optional retry-after headers are respected if present.
