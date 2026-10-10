# Graph Report - .  (2026-10-08)

## Corpus Check
- 246 files · ~214 153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 131 nodes · 230 edges · 14 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 108 · imports: 55 · calls: 35 · imports_from: 32


## Input Scope
- Requested: auto
- Resolved: all (source: default-auto)
- Included files: 246 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 0 sensitive · 0 missing committed
## God Nodes (most connected - your core abstractions)
1. `svgBlock()` - 30 edges
2. `playPalateClick()` - 8 edges
3. `translations` - 7 edges
4. `Instance` - 6 edges
5. `Language` - 6 edges
6. `AnimatedText()` - 4 edges
7. `LOADER_METADATA` - 4 edges
8. `syncOfficialVersions()` - 4 edges
9. `LogEntry` - 3 edges
10. `VersionGroup` - 3 edges

## Surprising Connections (you probably didn't know these)
- `makeBlueIce()` --calls--> `svgBlock()`  [EXTRACTED]
  scripts/generate_block_icons.js → scripts/generate_block_icons.js  _Bridges community 2 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (21): InstancesView(), InstancesViewProps, smoothEase, ALL_VERSION_ITEMS, getSupportedLoaders(), LOADER_METADATA, MOD_LOADERS, ModLoader (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (17): makeAmethyst(), makeAnvil(), makeBed(), makeCherryLeaves(), makeConcrete(), makeDeepslate(), makeEmerald(), makeEyeOfEnder() (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (15): files, makeBlueIce(), makeCobblestone(), makeCopperBlock(), makeElytra(), makeEmeraldBlock(), makeFireflyBush(), makeHoney() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (11): ModsInstanceSelectModal(), ModsViewProps, SourceFilter, CURSEFORGE_CROSS_MODS, formatDownloadCount(), getModDownloadUrl(), LocalMod, ModDownloadVersion (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.24
Nodes (6): LogEntry, ModsView(), smoothEase, Window, filterMinecraftLog(), getCurrentTimeFormatted()

### Community 5 - "Community 5"
Cohesion: 0.32
Nodes (6): AppSettings, SettingsModalContent(), SettingsModalContentProps, Language, TranslationKey, translations

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (4): AnimatedText(), AnimatedTextProps, ModsInstanceSelectModalProps, smoothEase

### Community 7 - "Community 7"
Cohesion: 0.50
Nodes (4): download(), outDir, run(), textures

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (4): download(), outDir, run(), updates

### Community 9 - "Community 9"
Cohesion: 0.50
Nodes (3): ConsoleView(), ConsoleViewProps, Instance

### Community 10 - "Community 10"
Cohesion: 0.50
Nodes (3): DitherWaveCanvas(), DitherWaveCanvasProps, LauncherTab

### Community 11 - "Community 11"
Cohesion: 0.50
Nodes (2): __dirname, __filename

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (2): DitherWaveCanvasProps, LauncherTab

### Community 13 - "Community 13"
Cohesion: 0.83
Nodes (3): getAudioContext(), playNfsIntroSfx(), playPalateClick()

## Knowledge Gaps
- **33 isolated node(s):** `__filename`, `__dirname`, `outDir`, `textures`, `outDir` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `__dirname`, `__filename`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `DitherWaveCanvasProps`, `LauncherTab`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `svgBlock()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `playPalateClick()` connect `Community 13` to `Community 9`, `Community 0`, `Community 6`, `Community 3`, `Community 5`, `Community 4`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `translations` connect `Community 5` to `Community 9`, `Community 0`, `Community 6`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `outDir` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._