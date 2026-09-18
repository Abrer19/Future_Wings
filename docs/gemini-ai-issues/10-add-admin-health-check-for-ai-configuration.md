# Issue 10: Add Admin Health Check For AI Configuration

Expose whether AI services are configured and reachable.

Acceptance criteria:
- Admin dashboard can show Gemini configured/unconfigured status.
- Health check does not leak secrets.
- Optional live check verifies the configured model can answer a tiny request.
