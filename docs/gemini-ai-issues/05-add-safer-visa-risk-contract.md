# Issue 5: Add Safer Visa Risk Contract

Replace free-form numeric parsing with strict JSON output.

Acceptance criteria:
- Gemini returns `{ "score": 0.0, "reasons": [], "recommendations": [] }`.
- Parsing rejects missing or invalid score values.
- The score remains clamped between 0 and 1.
