# Graph Report - Eternal Project - MC Launcher  (2026-10-08)

## Corpus Check
- Large corpus: 691 files · ~701,024 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 297 nodes · 439 edges · 30 communities (15 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ref_framer_motion / ref_lucide_react / ref_react / src_app
- package / package_main / package_name / package_private
- scripts_generate_block_icons / scripts_generate_block_icons_files / scripts_generate_block_icons_makeamethyst / scripts_generate_block_icons_makeanvil
- src_components_instancesview / src_components_instancesview_instancesview / src_components_instancesview_smoothease / src_types_instance
- generate_covers / generate_covers_fs / generate_covers_generatesvg / generate_covers_list
- src_tauri_tauri_conf / src_tauri_tauri_conf_android_debugapplicationidsuffix / src_tauri_tauri_conf_app / src_tauri_tauri_conf_app_security
- tsconfig_app / tsconfig_app_compileroptions / tsconfig_app_compileroptions_allowarbitraryextensions / tsconfig_app_compileroptions_allowimportingtsextensions
- package_devdependencies / package_devdependencies_concurrently / package_devdependencies_cross_env / package_devdependencies_electron
- tsconfig_node / tsconfig_node_compileroptions / tsconfig_node_compileroptions_allowimportingtsextensions / tsconfig_node_compileroptions_erasablesyntaxonly
- electron_main / electron_main_createwindow / electron_main_dirname / electron_main_filename
- package_dependencies / package_dependencies_canvas_confetti / package_dependencies_framer_motion / package_dependencies_lucide_react
- shader_examples_ditherwavecanvas / shader_examples_ditherwavecanvas_ditherwavecanvas / shader_examples_ditherwavecanvas_ditherwavecanvas_createshader / shader_examples_ditherwavecanvas_ditherwavecanvas_render
- src_components_ditherwavecanvas / src_components_ditherwavecanvas_ditherwavecanvas / src_components_ditherwavecanvas_ditherwavecanvas_createshader / src_components_ditherwavecanvas_ditherwavecanvas_render
- oxlintrc / oxlintrc_plugins / oxlintrc_rules / oxlintrc_rules_react_only_export_components
- src_tauri_capabilities_default / src_tauri_capabilities_default_description / src_tauri_capabilities_default_identifier / src_tauri_capabilities_default_permissions
- tsconfig / tsconfig_files / tsconfig_references
- pkg_app

## God Nodes (most connected - your core abstractions)
1. `svgBlock()` - 30 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 15 edges
4. `playPalateClick()` - 14 edges
5. `App()` - 11 edges
6. `Language` - 11 edges
7. `react` - 10 edges
8. `Instance` - 10 edges
9. `InstancesView()` - 8 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `DitherWaveCanvas()`  [EXTRACTED]
  src/App.tsx → src/components/DitherWaveCanvas.tsx
- `App()` --calls--> `InstancesView()`  [EXTRACTED]
  src/App.tsx → src/components/InstancesView.tsx
- `InstancesView()` --calls--> `playPalateClick()`  [EXTRACTED]
  src/components/InstancesView.tsx → src/utils/sound.ts
- `App()` --calls--> `AnimatedText()`  [EXTRACTED]
  src/App.tsx → src/components/AnimatedText.tsx
- `App()` --calls--> `ConsoleView()`  [EXTRACTED]
  src/App.tsx → src/components/ConsoleView.tsx
- `App()` --calls--> `ModsView()`  [EXTRACTED]
  src/App.tsx → src/components/ModsView.tsx
- `App()` --calls--> `SettingsModalContent()`  [EXTRACTED]
  src/App.tsx → src/components/SettingsModalContent.tsx
- `App()` --calls--> `filterMinecraftLog()`  [EXTRACTED]
  src/App.tsx → src/utils/logFilter.ts
- `App()` --calls--> `getCurrentTimeFormatted()`  [EXTRACTED]
  src/App.tsx → src/utils/logFilter.ts
- `App()` --calls--> `playPalateClick()`  [EXTRACTED]
  src/App.tsx → src/utils/sound.ts

## Import Cycles
- None detected.

## Communities (30 total, 15 thin omitted)

### Community 0 - "ref_framer_motion / ref_lucide_react / ref_react / src_app"
Cohesion: 0.15
Nodes (29): framer-motion, lucide-react, react, App(), smoothEase, Window, AnimatedText(), AnimatedTextProps (+21 more)

### Community 1 - "package / package_main / package_name / package_private"
Cohesion: 0.06
Nodes (32): main, name, private, productName, scripts, build, dev, electron:dev (+24 more)

### Community 2 - "scripts_generate_block_icons / scripts_generate_block_icons_files / scripts_generate_block_icons_makeamethyst / scripts_generate_block_icons_makeanvil"
Cohesion: 0.12
Nodes (32): files, makeAmethyst(), makeAnvil(), makeBed(), makeBlueIce(), makeCherryLeaves(), makeCobblestone(), makeConcrete() (+24 more)

### Community 3 - "src_components_instancesview / src_components_instancesview_instancesview / src_components_instancesview_smoothease / src_types_instance"
Cohesion: 0.16
Nodes (21): InstancesView(), smoothEase, ALL_VERSION_ITEMS, getSupportedLoaders(), LOADER_METADATA, MOD_LOADERS, ModLoader, PREVIEW_OPTIONS (+13 more)

### Community 4 - "generate_covers / generate_covers_fs / generate_covers_generatesvg / generate_covers_list"
Cohesion: 0.11
Nodes (15): fs, list, path, targetDir, download(), outDir, run(), textures (+7 more)

### Community 5 - "src_tauri_tauri_conf / src_tauri_tauri_conf_android_debugapplicationidsuffix / src_tauri_tauri_conf_app / src_tauri_tauri_conf_app_security"
Cohesion: 0.10
Nodes (19): debugApplicationIdSuffix, app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl (+11 more)

### Community 6 - "tsconfig_app / tsconfig_app_compileroptions / tsconfig_app_compileroptions_allowarbitraryextensions / tsconfig_app_compileroptions_allowimportingtsextensions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 7 - "package_devdependencies / package_devdependencies_concurrently / package_devdependencies_cross_env / package_devdependencies_electron"
Cohesion: 0.11
Nodes (18): devDependencies, concurrently, cross-env, electron, electron-builder, oxlint, tailwindcss, @tailwindcss/vite (+10 more)

### Community 8 - "tsconfig_node / tsconfig_node_compileroptions / tsconfig_node_compileroptions_allowimportingtsextensions / tsconfig_node_compileroptions_erasablesyntaxonly"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "electron_main / electron_main_createwindow / electron_main_dirname / electron_main_filename"
Cohesion: 0.20
Nodes (5): createWindow(), __dirname, __filename, { contextBridge, ipcRenderer }, electron

### Community 10 - "package_dependencies / package_dependencies_canvas_confetti / package_dependencies_framer_motion / package_dependencies_lucide_react"
Cohesion: 0.29
Nodes (7): dependencies, canvas-confetti, framer-motion, lucide-react, react, react-dom, tailwind-merge

### Community 11 - "shader_examples_ditherwavecanvas / shader_examples_ditherwavecanvas_ditherwavecanvas / shader_examples_ditherwavecanvas_ditherwavecanvas_createshader / shader_examples_ditherwavecanvas_ditherwavecanvas_render"
Cohesion: 0.29
Nodes (4): DitherWaveCanvas(), createShader(), DitherWaveCanvasProps, LauncherTab

### Community 12 - "src_components_ditherwavecanvas / src_components_ditherwavecanvas_ditherwavecanvas / src_components_ditherwavecanvas_ditherwavecanvas_createshader / src_components_ditherwavecanvas_ditherwavecanvas_render"
Cohesion: 0.29
Nodes (4): DitherWaveCanvas(), createShader(), DitherWaveCanvasProps, LauncherTab

### Community 13 - "oxlintrc / oxlintrc_plugins / oxlintrc_rules / oxlintrc_rules_react_only_export_components"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 14 - "src_tauri_capabilities_default / src_tauri_capabilities_default_description / src_tauri_capabilities_default_identifier / src_tauri_capabilities_default_permissions"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

## Knowledge Gaps
- **142 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `__filename` (+137 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 172 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `electron_main / electron_main_createwindow / electron_main_dirname / electron_main_filename` to `package / package_main / package_name / package_private`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_framer_motion / ref_lucide_react / ref_react / src_app` be split into smaller, more focused modules?**
  _Cohesion score 0.14871794871794872 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ref_framer_motion / ref_lucide_react / ref_react / src_app` to `src_components_instancesview / src_components_instancesview_instancesview / src_components_instancesview_smoothease / src_types_instance`, `package / package_main / package_name / package_private`, `shader_examples_ditherwavecanvas / shader_examples_ditherwavecanvas_ditherwavecanvas / shader_examples_ditherwavecanvas_ditherwavecanvas_createshader / shader_examples_ditherwavecanvas_ditherwavecanvas_render`, `src_components_ditherwavecanvas / src_components_ditherwavecanvas_ditherwavecanvas / src_components_ditherwavecanvas_ditherwavecanvas_createshader / src_components_ditherwavecanvas_ditherwavecanvas_render`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `package / package_main / package_name / package_private` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `package_devdependencies / package_devdependencies_concurrently / package_devdependencies_cross_env / package_devdependencies_electron` to `package / package_main / package_name / package_private`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `scripts_generate_block_icons / scripts_generate_block_icons_files / scripts_generate_block_icons_makeamethyst / scripts_generate_block_icons_makeanvil` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._