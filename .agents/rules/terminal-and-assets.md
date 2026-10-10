# User Preference: Interactive Terminal & Brand Assets

## Interactive Terminal Shell
- When opening an interactive terminal window for the user on Windows (e.g. for authentication, interactive CLIs like `vercel`, `gh auth`, `npm login`), **always use Git Bash** (`git-bash.exe`) instead of standard cmd or powershell:
  - Typical location: `C:\Users\zshaf\AppData\Local\Programs\Git\git-bash.exe` or `C:\Program Files\Git\git-bash.exe`.
  - Launch with `-c "<command>; bash"` to keep the interactive session responsive.

## Minecraft Loader Brand Assets
- Always use the **exact canonical official logos/icons** for mod loaders:
  - **Fabric**: Official pixel parchment/scroll (`fabric.png` from `FabricMC`).
  - **NeoForge**: Official vector fox (`neoforge.svg` from `docs.neoforged.net`).
  - **Forge**: Official anvil icon (`forge.png` from `files.minecraftforge.net/favicon.ico`).
  - **Vanilla**: Grass block cube.
- Never substitute them with generic or custom-drawn vector shapes.
