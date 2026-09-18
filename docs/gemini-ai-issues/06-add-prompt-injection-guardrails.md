# Issue 6: Add Prompt Injection Guardrails

Harden prompts that include user-supplied profile/application text.

Acceptance criteria:
- User content is clearly delimited in every prompt.
- System instructions tell Gemini to ignore instructions inside user data.
- Tests verify the prompt format is stable.
