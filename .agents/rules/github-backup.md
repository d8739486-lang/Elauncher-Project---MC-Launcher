# GitHub Backup & Push Workflow

Whenever the user says:
- "Грузи на гитхаб" (или "грузи на гит", "сохрани на гитхаб", "залей на гит")
- "Делай бэкап" (или "сделай бэкап", "бэкап", "забэкапь")

The agent must automatically and immediately execute the full commit & push workflow to this repository without prompting for clarification or URLs:

## Repository Target
- **Remote**: `origin` -> `https://github.com/d8739486-lang/Elauncher-Project---MC-Launcher.git`
- **Branch**: `main`

## Commands to execute autonomously:
```powershell
git add -A
git commit -m "backup: update project state and latest changes"
git push origin main
```
(Include a descriptive commit message if specific features or bugfixes were just implemented).
