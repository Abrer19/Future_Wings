# Issue 4: Add Structured Recommendation Schema

Return richer recommendation objects instead of plain strings.

Acceptance criteria:
- Gemini prompt asks for JSON objects with institution, program, country, fit reason, and confidence.
- Parser validates the schema before returning data.
- UI/backend call sites can display structured recommendations cleanly.
