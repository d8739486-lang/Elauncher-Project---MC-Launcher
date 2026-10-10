---
trigger: always_on
---

# Strict User-Defined Content Only

1. Never generate unprompted placeholder text, mock statuses, or fake version strings (e.g. "Alpha Preview", "v1.0.0", dummy subtitles) unless explicitly provided by the user.
2. If the user asks for a panel or view to be "empty", render completely empty containers without adding placeholder descriptions or info cards.
3. Dialogs and settings requested as "separate window" must be implemented as centered floating modal windows with their own header and close action, not as sliding drawers attached to the side edge.
