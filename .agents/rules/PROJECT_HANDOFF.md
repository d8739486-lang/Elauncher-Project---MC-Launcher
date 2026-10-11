# PROJECT_HANDOFF.md — Архитектурный контекст и состояние проекта

> **Для любого ИИ-агента в любом чате**: этот документ содержит полную актуальную информацию о проекте, стеке технологий, строгих правилах, решённых задачах и структуре файлов. Прочитай его перед началом работы, чтобы мгновенно подхватить контекст без потери нити разработки.

---

## 1. О проекте (Eternal Launcher / ELauncher)
- **Суть**: Премиальный, ультрабыстрый веб/десктоп лаунчер для Minecraft с акцентом на агрессивный кибер/гоночный стиль (Need for Speed Heat / Tech brutalism).
- **Стек**:
  - React 19 + TypeScript (Strict)
  - Vite 8.3
  - Tailwind CSS + Framer Motion
  - Lucide React (иконки)
  - Howler / Web Audio API (звуковой движок кликов и откликов интерфейса `palateClick`)
- **Развёртывание**:
  - Live Vercel Production: `https://eternal-project-launcher.vercel.app`
  - Локальный запуск: `./start` или `npm run dev` на порту `5173`.
  - Сборка: `npm run build` (`tsc -b && vite build`).

---

## 2. Строгие правила пользователя (User Rules)
1. **Строжайший запрет любого несанкционированного контента**:
   - Никаких плейсхолдеров, фиктивных статусов («Alpha Preview», «v1.0.0»), эмодзи или выдуманных описаний.
   - Если пользователь просит пустую панель — рендерить полностью пустой контейнер.
2. **Модальные окна**:
   - Настройки и создание профилей/сборок («отдельное окно») открываются **только как центрированные плавающие модальные окна** с собственным крестиком закрытия и заголовком. **Никаких боковых выезжающих шторок (drawers)**!
3. **Блокировка браузерных интерфейсов**:
   - Полный запрет контекстного меню (`contextmenu`), клавиш DevTools (`F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+U`), зума и выделения текста (`user-select: none`).
4. **Полноэкранный режим**:
   - Полноэкранный режим реализован через HTML5 Fullscreen API (`document.documentElement.requestFullscreen`) и работает одинаково в десктопном приложении и в браузере (на Vercel) по кнопке «Развернуть» в шапке и по клавише `F11`.
5. **Форматы аудио (Строго)**:
   - **Все звуковые эффекты (SFX)** — **ТОЛЬКО В `.wav`** (`public/intro_sfx.wav`, `public/click.wav`).
   - **Только длинные мелодии/саундтреки** — в `.mp3`. Никаких `.mp3` для коротких кликов или эффектов!

---

## 3. Архитектура экранов и вкладок
Управление вкладками осуществляется через `currentTab: 'play' | 'instances' | 'mods' | 'accounts'`:
1. **`play` (ИГРАТЬ)**:
   - Центральный логотип (`/logo.png`), агрессивная карточка сборки со скошенным брендовым глифом `letter_e_tight.png`.
   - Кнопка «ИГРАТЬ» с зеркальным световым бликом.
2. **`instances` (СБОРКИ)**:
   - `src/components/InstancesView.tsx`: список сборок с поиском, фильтрами версий (Релизы, Снапшоты, Бета/Альфа) и загрузчиков (Fabric, Forge, NeoForge, Vanilla).
   - Модальное окно создания сборки по центру экрана.
3. **`mods` (МОДЫ)**:
   - Раздел управления модификациями.
4. **`accounts` (АККАУНТЫ)**:
   - `src/components/AccountsView.tsx`: локальная оффлайн-регистрация аккаунта с генерацией UUID и скина.

---

## 4. JavaAgent — Кастомное главное меню Minecraft (`tools/agent/`)
- JAR: `tools/elauncher-bg.jar` (пересобрать через `tools/build-agent.ps1`)
- Деплой: `%APPDATA%\ELauncher\tools\elauncher-bg.jar` + `%APPDATA%\ELauncher\menu_background.jpg`
- Работает на **ВСЕХ версиях**: Vanilla, Fabric, Forge, NeoForge, Snapshots.
- **Без модов, без ресурспаков** — чистый JVM-уровень через `-javaagent`.

### Архитектура (4 класса):
1. **`BackgroundAgent.java`** — `premain()` + ASM-трансформеры 3 классов:
   - `hor` / `class_766` → `PanoramaRenderer.render()` → заменяет на `ShaderRenderer.renderBackground()`
   - `gsb` / `class_437` → `Screen.renderPanorama()` → подавляет ванильную панораму
   - `gsf` / `class_442` → `TitleScreen.render()` → вызывает `MenuDispatcher.dispatchIfNeeded()`
2. **`ShaderRenderer.java`** — OpenGL рендеринг:
   - Загружает `menu_background.jpg` через `javax.imageio.ImageIO` (zero extra deps)
   - Путь к изображению передаётся через `-Delauncher.bgImage=...` (из `minecraftEngine.js`)
   - Рисует кнопки (Singleplayer, Multiplayer, Settings, Language, Quit) через GLSL + GLFW mouse polling
   - Кнопочные лейблы генерируются Java AWT `Graphics2D` как текстуры
3. **`MenuState.java`** — `volatile String pendingAction` — мост кликов между ShaderRenderer и BackgroundAgent
4. **`MenuDispatcher.java`** — читает `MenuState.pendingAction` и навигирует в нужный экран Minecraft через Reflection

### Передача параметров из лаунчера:
```
-javaagent:${launcherPath}/tools/elauncher-bg.jar
-Delauncher.bgImage=${launcherPath}/menu_background.jpg
```
Добавляется автоматически в `minecraftEngine.js` для **всех** версий (включая Vanilla).

> ⚠️ **Ресурспак-костыль `universalTheme` удалён** — он нестабилен на разных версиях и конфликтует с Fabric/Forge модами. Импорт в `minecraftEngine.js` остался, но вызовы убраны.

---

## 5. Графика и текстуры GUI (`mod_assets/textures/gui/`)
В проекте используются оригинальные брендовые текстуры со скошенной заглавной буквой «E» (`public/letter_e_tight.png`) и шрифтом **Barlow Condensed Black**:
- `title_elauncher.png` (512×128, RGBA) — надпись `ELAUNCHER`.
- `title_banner_elauncher_project.png` (1024×128, RGBA) — надпись `ELAUNCHER PROJECT`.
- `title_elauncher_project_minecraft.png` (1024×128, RGBA) — надпись `ELAUNCHER PROJECT MINECRAFT`.
- `title_elauncher_project.png` (512×128, RGBA) — компактная надпись `ELAUNCHER PROJECT`.
- Оригиналы сохранены рядом: `title_eternal.png`, `title_banner.png`, `title_eternal_minecraft.png`, `title_minecraft.png`.

---

## 6. Важные команды и скрипты
- `npm run dev` — запуск локального Vite сервера разработки.
- `npm run build` — проверка типов TypeScript и сборка продакшн-бандла.
- `powershell -ExecutionPolicy Bypass -File .\scripts\generate_barlow_titles.ps1` — генератор надписей.
