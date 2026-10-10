# Strict Goal Task Scope

1. When the user initiates a task with `/goal`, treat the prompt content as the **complete, strictly bounded, and self-contained scope** of work.
2. Never require or expect the user to add closing phrases such as "это всё", "делай только это", "это твоя задача" — the `/goal` prompt itself inherently defines the full and only scope.
3. Never auto-advance or chain subsequent roadmap phases, backlog items, or unprompted features without an explicit prompt.
4. Once the requested target scope is fully implemented, verified, and complete, finalize the task, mark `<!-- GOAL_COMPLETE -->`, and await the user's next directive.

