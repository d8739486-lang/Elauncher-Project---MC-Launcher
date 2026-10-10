# Graphy Codebase Analysis

### File Structure Summary
- Total Files: 901
- Total Directories: 180
- File Extensions: .json: 43, .js: 6, .cjs: 3, .html: 2, .md: 271, .zip: 1, .ts: 17, .txt: 38, .ttf: 55, .jsx: 2, .sh: 6, .py: 67, .xsd: 78, .xml: 8, .lock: 2, .csv: 48, .png: 140, .mjs: 9, .dot: 1, .ico: 3, .wav: 2, .svg: 57, .jpg: 7, .ps1: 9, .tsx: 10, .css: 2, .rs: 3, .toml: 1, .icns: 1

### Directory Tree
```
  ├── .agents
   │  ├── PROJECT_STATE.md
   │  ├── rules
   │  │  ├── goal-scope.md
   │  │  ├── no-unprompted-content.md
   │  │  ├── PROJECT_HANDOFF.md
   │  │  └── terminal-and-assets.md
   │  └── skills
   │    ├── .DS_Store
   │    ├── brainstorming
   │     │  └── SKILL.md
   │    ├── canvas-design
   │     │  ├── canvas-fonts
   │     │  │  ├── ArsenalSC-OFL.txt
   │     │  │  ├── ArsenalSC-Regular.ttf
   │     │  │  ├── BigShoulders-Bold.ttf
   │     │  │  ├── BigShoulders-OFL.txt
   │     │  │  ├── BigShoulders-Regular.ttf
   │     │  │  ├── Boldonse-OFL.txt
   │     │  │  ├── Boldonse-Regular.ttf
   │     │  │  ├── BricolageGrotesque-Bold.ttf
   │     │  │  ├── BricolageGrotesque-OFL.txt
   │     │  │  ├── BricolageGrotesque-Regular.ttf
   │     │  │  ├── CrimsonPro-Bold.ttf
   │     │  │  ├── CrimsonPro-Italic.ttf
   │     │  │  ├── CrimsonPro-OFL.txt
   │     │  │  ├── CrimsonPro-Regular.ttf
   │     │  │  ├── DMMono-OFL.txt
   │     │  │  ├── DMMono-Regular.ttf
   │     │  │  ├── EricaOne-OFL.txt
   │     │  │  ├── EricaOne-Regular.ttf
   │     │  │  ├── GeistMono-Bold.ttf
   │     │  │  ├── GeistMono-OFL.txt
   │     │  │  ├── GeistMono-Regular.ttf
   │     │  │  ├── Gloock-OFL.txt
   │     │  │  ├── Gloock-Regular.ttf
   │     │  │  ├── IBMPlexMono-Bold.ttf
   │     │  │  ├── IBMPlexMono-OFL.txt
   │     │  │  ├── IBMPlexMono-Regular.ttf
   │     │  │  ├── IBMPlexSerif-Bold.ttf
   │     │  │  ├── IBMPlexSerif-BoldItalic.ttf
   │     │  │  ├── IBMPlexSerif-Italic.ttf
   │     │  │  ├── IBMPlexSerif-Regular.ttf
   │     │  │  ├── InstrumentSans-Bold.ttf
   │     │  │  ├── InstrumentSans-BoldItalic.ttf
   │     │  │  ├── InstrumentSans-Italic.ttf
   │     │  │  ├── InstrumentSans-OFL.txt
   │     │  │  ├── InstrumentSans-Regular.ttf
   │     │  │  ├── InstrumentSerif-Italic.ttf
   │     │  │  ├── InstrumentSerif-Regular.ttf
   │     │  │  ├── Italiana-OFL.txt
   │     │  │  ├── Italiana-Regular.ttf
   │     │  │  ├── JetBrainsMono-Bold.ttf
   │     │  │  ├── JetBrainsMono-OFL.txt
   │     │  │  ├── JetBrainsMono-Regular.ttf
   │     │  │  ├── Jura-Light.ttf
   │     │  │  ├── Jura-Medium.ttf
   │     │  │  ├── Jura-OFL.txt
   │     │  │  ├── LibreBaskerville-OFL.txt
   │     │  │  ├── LibreBaskerville-Regular.ttf
   │     │  │  ├── Lora-Bold.ttf
   │     │  │  ├── Lora-BoldItalic.ttf
   │     │  │  ├── Lora-Italic.ttf
   │     │  │  ├── Lora-OFL.txt
   │     │  │  ├── Lora-Regular.ttf
   │     │  │  ├── NationalPark-Bold.ttf
   │     │  │  ├── NationalPark-OFL.txt
   │     │  │  ├── NationalPark-Regular.ttf
   │     │  │  ├── NothingYouCouldDo-OFL.txt
   │     │  │  ├── NothingYouCouldDo-Regular.ttf
   │     │  │  ├── Outfit-Bold.ttf
   │     │  │  ├── Outfit-OFL.txt
   │     │  │  ├── Outfit-Regular.ttf
   │     │  │  ├── PixelifySans-Medium.ttf
   │     │  │  ├── PixelifySans-OFL.txt
   │     │  │  ├── PoiretOne-OFL.txt
   │     │  │  ├── PoiretOne-Regular.ttf
   │     │  │  ├── RedHatMono-Bold.ttf
   │     │  │  ├── RedHatMono-OFL.txt
   │     │  │  ├── RedHatMono-Regular.ttf
   │     │  │  ├── Silkscreen-OFL.txt
   │     │  │  ├── Silkscreen-Regular.ttf
   │     │  │  ├── SmoochSans-Medium.ttf
   │     │  │  ├── SmoochSans-OFL.txt
   │     │  │  ├── Tektur-Medium.ttf
   │     │  │  ├── Tektur-OFL.txt
   │     │  │  ├── Tektur-Regular.ttf
   │     │  │  ├── WorkSans-Bold.ttf
   │     │  │  ├── WorkSans-BoldItalic.ttf
   │     │  │  ├── WorkSans-Italic.ttf
   │     │  │  ├── WorkSans-OFL.txt
   │     │  │  ├── WorkSans-Regular.ttf
   │     │  │  ├── YoungSerif-OFL.txt
   │     │  │  └── YoungSerif-Regular.ttf
   │     │  ├── LICENSE.txt
   │     │  └── SKILL.md
   │    ├── claude-d3js-skill
   │     │  ├── assets
   │     │  │  ├── chart-template.jsx
   │     │  │  ├── interactive-template.jsx
   │     │  │  └── sample-data.json
   │     │  ├── references
   │     │  │  ├── colour-schemes.md
   │     │  │  ├── d3-patterns.md
   │     │  │  └── scale-reference.md
   │     │  └── SKILL.md
   │    ├── code-review-checklist
   │     │  └── SKILL.md
   │    ├── codebase-audit
   │     │  ├── references
   │     │  │  ├── ai_slop_patterns.md
   │     │  │  ├── code_principles.md
   │     │  │  ├── database_api.md
   │     │  │  ├── error_boundaries.md
   │     │  │  ├── financial_data.md
   │     │  │  ├── offline_sync.md
   │     │  │  ├── performance_memory.md
   │     │  │  ├── react_hooks.md
   │     │  │  ├── react_performance.md
   │     │  │  ├── state_management.md
   │     │  │  ├── styling_tailwind.md
   │     │  │  ├── tma_security.md
   │     │  │  ├── tma_specific.md
   │     │  │  └── ui_architecture.md
   │     │  ├── scripts
   │     │  │  ├── detect_ai_slop.sh
   │     │  │  ├── detect_antipatterns.sh
   │     │  │  ├── detect_performance_issues.sh
   │     │  │  └── detect_type_violations.sh
   │     │  └── SKILL.md
   │    ├── concise-planning
   │     │  └── SKILL.md
   │    ├── content-creator
   │     │  ├── assets
   │     │  │  └── content_calendar_template.md
   │     │  ├── references
   │     │  │  ├── brand_guidelines.md
   │     │  │  ├── content_frameworks.md
   │     │  │  └── social_media_optimization.md
   │     │  ├── scripts
   │     │  │  ├── brand_voice_analyzer.py
   │     │  │  └── seo_optimizer.py
   │     │  └── SKILL.md
   │    ├── context-skill-status
   │     │  └── SKILL.md
   │    ├── context-window-management
   │     │  └── SKILL.md
   │    ├── copy-editing
   │     │  └── SKILL.md
   │    ├── copywriting
   │     │  └── SKILL.md
   │    ├── creative-shaders-design
   │     │  └── SKILL.md
   │    ├── database-architect
   │     │  └── SKILL.md
   │    ├── database-design
   │     │  ├── database-selection.md
   │     │  ├── indexing.md
   │     │  ├── migrations.md
   │     │  ├── optimization.md
   │     │  ├── orm-selection.md
   │     │  ├── schema-design.md
   │     │  ├── scripts
   │     │  │  └── schema_validator.py
   │     │  └── SKILL.md
   │    ├── design-system-creator
   │     │  ├── assets
   │     │  │  └── templates
   │     │  │    ├── ANTIPATTERNS.md
   │     │  │    ├── COMPONENTS.md
   │     │  │    ├── DESIGN-AI.md
   │     │  │    ├── DESIGN-HUMAN.md
   │     │  │    ├── FEATURE-CHECKLIST.md
   │     │  │    └── PURPOSE.md
   │     │  ├── references
   │     │  │  ├── accessibility-checklist.md
   │     │  │  ├── animation-catalog.md
   │     │  │  ├── component-states.md
   │     │  │  ├── copy-tone-guide.md
   │     │  │  ├── icon-system.md
   │     │  │  ├── naming-conventions.md
   │     │  │  ├── platform-constraints.md
   │     │  │  ├── typography-scale.md
   │     │  │  ├── ux-audit-questions.md
   │     │  │  └── ux_principles.md
   │     │  ├── scripts
   │     │  │  ├── check_design_violations.py
   │     │  │  ├── diff_components.py
   │     │  │  ├── generate_changelog.py
   │     │  │  └── scan_design_system.py
   │     │  └── SKILL.md
   │    ├── documentation-generation-doc-generate
   │     │  ├── resources
   │     │  │  └── implementation-playbook.md
   │     │  └── SKILL.md
   │    ├── docx
   │     │  ├── docx-js.md
   │     │  ├── LICENSE.txt
   │     │  ├── ooxml
   │     │  │  ├── schemas
   │     │  │  │  ├── ecma
   │     │  │  │  │  └── fouth-edition
   │     │  │  │  │    ├── opc-contentTypes.xsd
   │     │  │  │  │    ├── opc-coreProperties.xsd
   │     │  │  │  │    ├── opc-digSig.xsd
   │     │  │  │  │    └── opc-relationships.xsd
   │     │  │  │  ├── ISO-IEC29500-4_2016
   │     │  │  │  │  ├── dml-chart.xsd
   │     │  │  │  │  ├── dml-chartDrawing.xsd
   │     │  │  │  │  ├── dml-diagram.xsd
   │     │  │  │  │  ├── dml-lockedCanvas.xsd
   │     │  │  │  │  ├── dml-main.xsd
   │     │  │  │  │  ├── dml-picture.xsd
   │     │  │  │  │  ├── dml-spreadsheetDrawing.xsd
   │     │  │  │  │  ├── dml-wordprocessingDrawing.xsd
   │     │  │  │  │  ├── pml.xsd
   │     │  │  │  │  ├── shared-additionalCharacteristics.xsd
   │     │  │  │  │  ├── shared-bibliography.xsd
   │     │  │  │  │  ├── shared-commonSimpleTypes.xsd
   │     │  │  │  │  ├── shared-customXmlDataProperties.xsd
   │     │  │  │  │  ├── shared-customXmlSchemaProperties.xsd
   │     │  │  │  │  ├── shared-documentPropertiesCustom.xsd
   │     │  │  │  │  ├── shared-documentPropertiesExtended.xsd
   │     │  │  │  │  ├── shared-documentPropertiesVariantTypes.xsd
   │     │  │  │  │  ├── shared-math.xsd
   │     │  │  │  │  ├── shared-relationshipReference.xsd
   │     │  │  │  │  ├── sml.xsd
   │     │  │  │  │  ├── vml-main.xsd
   │     │  │  │  │  ├── vml-officeDrawing.xsd
   │     │  │  │  │  ├── vml-presentationDrawing.xsd
   │     │  │  │  │  ├── vml-spreadsheetDrawing.xsd
   │     │  │  │  │  ├── vml-wordprocessingDrawing.xsd
   │     │  │  │  │  ├── wml.xsd
   │     │  │  │  │  └── xml.xsd
   │     │  │  │  ├── mce
   │     │  │  │  │  └── mc.xsd
   │     │  │  │  └── microsoft
   │     │  │  │    ├── wml-2010.xsd
   │     │  │  │    ├── wml-2012.xsd
   │     │  │  │    ├── wml-2018.xsd
   │     │  │  │    ├── wml-cex-2018.xsd
   │     │  │  │    ├── wml-cid-2016.xsd
   │     │  │  │    ├── wml-sdtdatahash-2020.xsd
   │     │  │  │    └── wml-symex-2015.xsd
   │     │  │  └── scripts
   │     │  │    ├── pack.py
   │     │  │    ├── unpack.py
   │     │  │    ├── validate.py
   │     │  │    └── validation
   │     │  │       ├── base.py
   │     │  │       ├── docx.py
   │     │  │       ├── pptx.py
   │     │  │       ├── redlining.py
   │     │  │       └── __init__.py
   │     │  ├── ooxml.md
   │     │  ├── scripts
   │     │  │  ├── document.py
   │     │  │  ├── templates
   │     │  │  │  ├── comments.xml
   │     │  │  │  ├── commentsExtended.xml
   │     │  │  │  ├── commentsExtensible.xml
   │     │  │  │  ├── commentsIds.xml
   │     │  │  │  └── people.xml
   │     │  │  ├── utilities.py
   │     │  │  └── __init__.py
   │     │  └── SKILL.md
   │    ├── e2e-testing-patterns
   │     │  ├── resources
   │     │  │  └── implementation-playbook.md
   │     │  └── SKILL.md
   │    ├── frontend-design
   │     │  ├── LICENSE.txt
   │     │  └── SKILL.md
   │    ├── frontend-developer
   │     │  └── SKILL.md
   │    ├── frontend-security-coder
   │     │  └── SKILL.md
   │    ├── graphify
   │     │  ├── .graphify_version
   │     │  └── SKILL.md
   │    ├── mcp-builder
   │     │  ├── LICENSE.txt
   │     │  ├── reference
   │     │  │  ├── evaluation.md
   │     │  │  ├── mcp_best_practices.md
   │     │  │  ├── node_mcp_server.md
   │     │  │  └── python_mcp_server.md
   │     │  ├── scripts
   │     │  │  ├── connections.py
   │     │  │  ├── evaluation.py
   │     │  │  ├── example_evaluation.xml
   │     │  │  └── requirements.txt
   │     │  └── SKILL.md
   │    ├── mobile-design
   │     │  ├── decision-trees.md
   │     │  ├── mobile-backend.md
   │     │  ├── mobile-color-system.md
   │     │  ├── mobile-debugging.md
   │     │  ├── mobile-design-thinking.md
   │     │  ├── mobile-navigation.md
   │     │  ├── mobile-performance.md
   │     │  ├── mobile-testing.md
   │     │  ├── mobile-typography.md
   │     │  ├── platform-android.md
   │     │  ├── platform-ios.md
   │     │  ├── scripts
   │     │  │  └── mobile_audit.py
   │     │  ├── SKILL.md
   │     │  └── touch-psychology.md
   │    ├── mobile-developer
   │     │  └── SKILL.md
   │    ├── no-ai-noise
   │     │  └── SKILL.md
   │    ├── pdf
   │     │  ├── forms.md
   │     │  ├── LICENSE.txt
   │     │  ├── reference.md
   │     │  ├── scripts
   │     │  │  ├── check_bounding_boxes.py
   │     │  │  ├── check_bounding_boxes_test.py
   │     │  │  ├── check_fillable_fields.py
   │     │  │  ├── convert_pdf_to_images.py
   │     │  │  ├── create_validation_image.py
   │     │  │  ├── extract_form_field_info.py
   │     │  │  ├── fill_fillable_fields.py
   │     │  │  └── fill_pdf_form_with_annotations.py
   │     │  └── SKILL.md
   │    ├── pdf-official
   │     │  ├── forms.md
   │     │  ├── LICENSE.txt
   │     │  ├── reference.md
   │     │  ├── scripts
   │     │  │  ├── check_bounding_boxes.py
   │     │  │  ├── check_bounding_boxes_test.py
   │     │  │  ├── check_fillable_fields.py
   │     │  │  ├── convert_pdf_to_images.py
   │     │  │  ├── create_validation_image.py
   │     │  │  ├── extract_form_field_info.py
   │     │  │  ├── fill_fillable_fields.py
   │     │  │  └── fill_pdf_form_with_annotations.py
   │     │  └── SKILL.md
   │    ├── performance-analysis
   │     │  ├── assets
   │     │  ├── references
   │     │  │  ├── investigation_patterns.md
   │     │  │  ├── react_patterns.md
   │     │  │  ├── reporting_template.md
   │     │  │  ├── rum_patterns.md
   │     │  │  ├── state_patterns.md
   │     │  │  ├── supabase_patterns.md
   │     │  │  ├── tma_advanced_optimization.md
   │     │  │  └── tma_patterns.md
   │     │  ├── scripts
   │     │  │  ├── audit_renders.sh
   │     │  │  └── detect_n_plus_one.sh
   │     │  └── SKILL.md
   │    ├── performance-engineer
   │     │  └── SKILL.md
   │    ├── plaid-fintech
   │     │  └── SKILL.md
   │    ├── pptx-official
   │     │  ├── html2pptx.md
   │     │  ├── LICENSE.txt
   │     │  ├── ooxml
   │     │  │  ├── schemas
   │     │  │  │  ├── ecma
   │     │  │  │  │  └── fouth-edition
   │     │  │  │  │    ├── opc-contentTypes.xsd
   │     │  │  │  │    ├── opc-coreProperties.xsd
   │     │  │  │  │    ├── opc-digSig.xsd
   │     │  │  │  │    └── opc-relationships.xsd
   │     │  │  │  ├── ISO-IEC29500-4_2016
   │     │  │  │  │  ├── dml-chart.xsd
   │     │  │  │  │  ├── dml-chartDrawing.xsd
   │     │  │  │  │  ├── dml-diagram.xsd
   │     │  │  │  │  ├── dml-lockedCanvas.xsd
   │     │  │  │  │  ├── dml-main.xsd
   │     │  │  │  │  ├── dml-picture.xsd
   │     │  │  │  │  ├── dml-spreadsheetDrawing.xsd
   │     │  │  │  │  ├── dml-wordprocessingDrawing.xsd
   │     │  │  │  │  ├── pml.xsd
   │     │  │  │  │  ├── shared-additionalCharacteristics.xsd
   │     │  │  │  │  ├── shared-bibliography.xsd
   │     │  │  │  │  ├── shared-commonSimpleTypes.xsd
   │     │  │  │  │  ├── shared-customXmlDataProperties.xsd
   │     │  │  │  │  ├── shared-customXmlSchemaProperties.xsd
   │     │  │  │  │  ├── shared-documentPropertiesCustom.xsd
   │     │  │  │  │  ├── shared-documentPropertiesExtended.xsd
   │     │  │  │  │  ├── shared-documentPropertiesVariantTypes.xsd
   │     │  │  │  │  ├── shared-math.xsd
   │     │  │  │  │  ├── shared-relationshipReference.xsd
   │     │  │  │  │  ├── sml.xsd
   │     │  │  │  │  ├── vml-main.xsd
   │     │  │  │  │  ├── vml-officeDrawing.xsd
   │     │  │  │  │  ├── vml-presentationDrawing.xsd
   │     │  │  │  │  ├── vml-spreadsheetDrawing.xsd
   │     │  │  │  │  ├── vml-wordprocessingDrawing.xsd
   │     │  │  │  │  ├── wml.xsd
   │     │  │  │  │  └── xml.xsd
   │     │  │  │  ├── mce
   │     │  │  │  │  └── mc.xsd
   │     │  │  │  └── microsoft
   │     │  │  │    ├── wml-2010.xsd
   │     │  │  │    ├── wml-2012.xsd
   │     │  │  │    ├── wml-2018.xsd
   │     │  │  │    ├── wml-cex-2018.xsd
   │     │  │  │    ├── wml-cid-2016.xsd
   │     │  │  │    ├── wml-sdtdatahash-2020.xsd
   │     │  │  │    └── wml-symex-2015.xsd
   │     │  │  └── scripts
   │     │  │    ├── pack.py
   │     │  │    ├── unpack.py
   │     │  │    ├── validate.py
   │     │  │    └── validation
   │     │  │       ├── base.py
   │     │  │       ├── docx.py
   │     │  │       ├── pptx.py
   │     │  │       ├── redlining.py
   │     │  │       └── __init__.py
   │     │  ├── ooxml.md
   │     │  ├── scripts
   │     │  │  ├── html2pptx.js
   │     │  │  ├── inventory.py
   │     │  │  ├── rearrange.py
   │     │  │  ├── replace.py
   │     │  │  └── thumbnail.py
   │     │  └── SKILL.md
   │    ├── prompt-writer
   │     │  └── SKILL.md
   │    ├── react-best-practices
   │     │  ├── AGENTS.md
   │     │  ├── metadata.json
   │     │  ├── README.md
   │     │  ├── rules
   │     │  │  ├── advanced-event-handler-refs.md
   │     │  │  ├── advanced-use-latest.md
   │     │  │  ├── async-api-routes.md
   │     │  │  ├── async-defer-await.md
   │     │  │  ├── async-dependencies.md
   │     │  │  ├── async-parallel.md
   │     │  │  ├── async-suspense-boundaries.md
   │     │  │  ├── bundle-barrel-imports.md
   │     │  │  ├── bundle-conditional.md
   │     │  │  ├── bundle-defer-third-party.md
   │     │  │  ├── bundle-dynamic-imports.md
   │     │  │  ├── bundle-preload.md
   │     │  │  ├── client-event-listeners.md
   │     │  │  ├── client-swr-dedup.md
   │     │  │  ├── js-batch-dom-css.md
   │     │  │  ├── js-cache-function-results.md
   │     │  │  ├── js-cache-property-access.md
   │     │  │  ├── js-cache-storage.md
   │     │  │  ├── js-combine-iterations.md
   │     │  │  ├── js-early-exit.md
   │     │  │  ├── js-hoist-regexp.md
   │     │  │  ├── js-index-maps.md
   │     │  │  ├── js-length-check-first.md
   │     │  │  ├── js-min-max-loop.md
   │     │  │  ├── js-set-map-lookups.md
   │     │  │  ├── js-tosorted-immutable.md
   │     │  │  ├── rendering-activity.md
   │     │  │  ├── rendering-animate-svg-wrapper.md
   │     │  │  ├── rendering-conditional-render.md
   │     │  │  ├── rendering-content-visibility.md
   │     │  │  ├── rendering-hoist-jsx.md
   │     │  │  ├── rendering-hydration-no-flicker.md
   │     │  │  ├── rendering-svg-precision.md
   │     │  │  ├── rerender-defer-reads.md
   │     │  │  ├── rerender-dependencies.md
   │     │  │  ├── rerender-derived-state.md
   │     │  │  ├── rerender-functional-setstate.md
   │     │  │  ├── rerender-lazy-state-init.md
   │     │  │  ├── rerender-memo.md
   │     │  │  ├── rerender-transitions.md
   │     │  │  ├── server-after-nonblocking.md
   │     │  │  ├── server-cache-lru.md
   │     │  │  ├── server-cache-react.md
   │     │  │  ├── server-parallel-fetching.md
   │     │  │  ├── server-serialization.md
   │     │  │  ├── _sections.md
   │     │  │  └── _template.md
   │     │  └── SKILL.md
   │    ├── react-native-architecture
   │     │  ├── resources
   │     │  │  └── implementation-playbook.md
   │     │  └── SKILL.md
   │    ├── react-patterns
   │     │  └── SKILL.md
   │    ├── scroll-experience
   │     │  └── SKILL.md
   │    ├── security-auditor
   │     │  └── SKILL.md
   │    ├── skill-creator
   │     │  ├── LICENSE.txt
   │     │  ├── references
   │     │  │  ├── output-patterns.md
   │     │  │  └── workflows.md
   │     │  ├── scripts
   │     │  │  ├── init_skill.py
   │     │  │  ├── package_skill.py
   │     │  │  └── quick_validate.py
   │     │  └── SKILL.md
   │    ├── skill-developer
   │     │  ├── ADVANCED.md
   │     │  ├── HOOK_MECHANISMS.md
   │     │  ├── PATTERNS_LIBRARY.md
   │     │  ├── SKILL.md
   │     │  ├── SKILL_RULES_REFERENCE.md
   │     │  ├── TRIGGER_TYPES.md
   │     │  └── TROUBLESHOOTING.md
   │    ├── sql-pro
   │     │  └── SKILL.md
   │    ├── strict-minimal-ui
   │     │  └── SKILL.md
   │    ├── test-driven-development
   │     │  ├── SKILL.md
   │     │  └── testing-anti-patterns.md
   │    ├── test-fixing
   │     │  └── SKILL.md
   │    ├── tests-creator
   │     │  ├── assets
   │     │  ├── references
   │     │  │  ├── component_testing.md
   │     │  │  ├── e2e_testing.md
   │     │  │  ├── electron_precision.md
   │     │  │  ├── integration_testing.md
   │     │  │  ├── motion_precision.md
   │     │  │  ├── platform_mocks.md
   │     │  │  ├── supabase_advanced.md
   │     │  │  ├── tma_precision.md
   │     │  │  └── unit_testing.md
   │     │  ├── scripts
   │     │  │  └── create_test.py
   │     │  └── SKILL.md
   │    ├── top-web-vulnerabilities
   │     │  └── SKILL.md
   │    ├── typescript-expert
   │     │  ├── references
   │     │  │  ├── tsconfig-strict.json
   │     │  │  ├── typescript-cheatsheet.md
   │     │  │  └── utility-types.ts
   │     │  ├── scripts
   │     │  │  └── ts_diagnostic.py
   │     │  └── SKILL.md
   │    ├── ui-text-writer
   │     │  ├── assets
   │     │  ├── references
   │     │  │  └── best-practices.md
   │     │  ├── scripts
   │     │  └── SKILL.md
   │    ├── ui-ux-pro-max
   │     │  ├── CLAUDE.md
   │     │  ├── cli
   │     │  │  ├── .gitignore
   │     │  │  ├── .npmignore
   │     │  │  ├── assets
   │     │  │  │  ├── data
   │     │  │  │  │  ├── charts.csv
   │     │  │  │  │  ├── colors.csv
   │     │  │  │  │  ├── icons.csv
   │     │  │  │  │  ├── landing.csv
   │     │  │  │  │  ├── products.csv
   │     │  │  │  │  ├── react-performance.csv
   │     │  │  │  │  ├── stacks
   │     │  │  │  │  │  ├── astro.csv
   │     │  │  │  │  │  ├── flutter.csv
   │     │  │  │  │  │  ├── html-tailwind.csv
   │     │  │  │  │  │  ├── jetpack-compose.csv
   │     │  │  │  │  │  ├── nextjs.csv
   │     │  │  │  │  │  ├── nuxt-ui.csv
   │     │  │  │  │  │  ├── nuxtjs.csv
   │     │  │  │  │  │  ├── react-native.csv
   │     │  │  │  │  │  ├── react.csv
   │     │  │  │  │  │  ├── shadcn.csv
   │     │  │  │  │  │  ├── svelte.csv
   │     │  │  │  │  │  ├── swiftui.csv
   │     │  │  │  │  │  └── vue.csv
   │     │  │  │  │  ├── styles.csv
   │     │  │  │  │  ├── typography.csv
   │     │  │  │  │  ├── ui-reasoning.csv
   │     │  │  │  │  ├── ux-guidelines.csv
   │     │  │  │  │  └── web-interface.csv
   │     │  │  │  ├── scripts
   │     │  │  │  │  ├── core.py
   │     │  │  │  │  ├── design_system.py
   │     │  │  │  │  └── search.py
   │     │  │  │  └── templates
   │     │  │  │    ├── base
   │     │  │  │     │  ├── quick-reference.md
   │     │  │  │     │  └── skill-content.md
   │     │  │  │    └── platforms
   │     │  │  │       ├── agent.json
   │     │  │  │       ├── claude.json
   │     │  │  │       ├── codebuddy.json
   │     │  │  │       ├── codex.json
   │     │  │  │       ├── continue.json
   │     │  │  │       ├── copilot.json
   │     │  │  │       ├── cursor.json
   │     │  │  │       ├── gemini.json
   │     │  │  │       ├── kiro.json
   │     │  │  │       ├── opencode.json
   │     │  │  │       ├── qoder.json
   │     │  │  │       ├── roocode.json
   │     │  │  │       ├── trae.json
   │     │  │  │       └── windsurf.json
   │     │  │  ├── bun.lock
   │     │  │  ├── package-lock.json
   │     │  │  ├── package.json
   │     │  │  ├── README.md
   │     │  │  ├── src
   │     │  │  │  ├── commands
   │     │  │  │  │  ├── init.ts
   │     │  │  │  │  ├── update.ts
   │     │  │  │  │  └── versions.ts
   │     │  │  │  ├── index.ts
   │     │  │  │  ├── types
   │     │  │  │  │  └── index.ts
   │     │  │  │  └── utils
   │     │  │  │    ├── detect.ts
   │     │  │  │    ├── extract.ts
   │     │  │  │    ├── github.ts
   │     │  │  │    ├── logger.ts
   │     │  │  │    └── template.ts
   │     │  │  └── tsconfig.json
   │     │  ├── LICENSE
   │     │  ├── README.md
   │     │  ├── screenshots
   │     │  │  └── website.png
   │     │  ├── SKILL.md
   │     │  └── src
   │     │    └── ui-ux-pro-max
   │     │       ├── data
   │     │        │  ├── charts.csv
   │     │        │  ├── colors.csv
   │     │        │  ├── icons.csv
   │     │        │  ├── landing.csv
   │     │        │  ├── products.csv
   │     │        │  ├── react-performance.csv
   │     │        │  ├── stacks
   │     │        │  │  ├── astro.csv
   │     │        │  │  ├── flutter.csv
   │     │        │  │  ├── html-tailwind.csv
   │     │        │  │  ├── jetpack-compose.csv
   │     │        │  │  ├── nextjs.csv
   │     │        │  │  ├── nuxt-ui.csv
   │     │        │  │  ├── nuxtjs.csv
   │     │        │  │  ├── react-native.csv
   │     │        │  │  ├── react.csv
   │     │        │  │  ├── shadcn.csv
   │     │        │  │  ├── svelte.csv
   │     │        │  │  ├── swiftui.csv
   │     │        │  │  └── vue.csv
   │     │        │  ├── styles.csv
   │     │        │  ├── typography.csv
   │     │        │  ├── ui-reasoning.csv
   │     │        │  ├── ux-guidelines.csv
   │     │        │  └── web-interface.csv
   │     │       ├── scripts
   │     │        │  ├── core.py
   │     │        │  ├── design_system.py
   │     │        │  └── search.py
   │     │       └── templates
   │     │          ├── base
   │     │           │  ├── quick-reference.md
   │     │           │  └── skill-content.md
   │     │          └── platforms
   │     │             ├── agent.json
   │     │             ├── claude.json
   │     │             ├── codebuddy.json
   │     │             ├── codex.json
   │     │             ├── continue.json
   │     │             ├── copilot.json
   │     │             ├── cursor.json
   │     │             ├── gemini.json
   │     │             ├── kiro.json
   │     │             ├── opencode.json
   │     │             ├── qoder.json
   │     │             ├── roocode.json
   │     │             ├── trae.json
   │     │             └── windsurf.json
   │    ├── understand
   │     │  ├── build-fingerprints.mjs
   │     │  ├── compute-batches.mjs
   │     │  ├── extract-import-map.mjs
   │     │  ├── extract-structure-result.mjs
   │     │  ├── extract-structure.mjs
   │     │  ├── frameworks
   │     │  │  ├── django.md
   │     │  │  ├── express.md
   │     │  │  ├── fastapi.md
   │     │  │  ├── flask.md
   │     │  │  ├── gin.md
   │     │  │  ├── nextjs.md
   │     │  │  ├── rails.md
   │     │  │  ├── react.md
   │     │  │  ├── spring.md
   │     │  │  └── vue.md
   │     │  ├── generate-ignore.mjs
   │     │  ├── languages
   │     │  │  ├── cpp.md
   │     │  │  ├── csharp.md
   │     │  │  ├── css.md
   │     │  │  ├── dockerfile.md
   │     │  │  ├── go.md
   │     │  │  ├── graphql.md
   │     │  │  ├── html.md
   │     │  │  ├── java.md
   │     │  │  ├── javascript.md
   │     │  │  ├── json.md
   │     │  │  ├── kotlin.md
   │     │  │  ├── markdown.md
   │     │  │  ├── php.md
   │     │  │  ├── protobuf.md
   │     │  │  ├── python.md
   │     │  │  ├── ruby.md
   │     │  │  ├── rust.md
   │     │  │  ├── scala.md
   │     │  │  ├── shell.md
   │     │  │  ├── sql.md
   │     │  │  ├── swift.md
   │     │  │  ├── terraform.md
   │     │  │  ├── typescript.md
   │     │  │  └── yaml.md
   │     │  ├── locales
   │     │  │  ├── en.md
   │     │  │  ├── ja.md
   │     │  │  ├── ko.md
   │     │  │  ├── ru.md
   │     │  │  ├── zh-TW.md
   │     │  │  └── zh.md
   │     │  ├── merge-batch-graphs.py
   │     │  ├── merge-subdomain-graphs.py
   │     │  ├── scan-project.mjs
   │     │  └── SKILL.md
   │    ├── understand-chat
   │     │  └── SKILL.md
   │    ├── understand-dashboard
   │     │  └── SKILL.md
   │    ├── understand-diff
   │     │  └── SKILL.md
   │    ├── understand-domain
   │     │  ├── extract-domain-context.py
   │     │  └── SKILL.md
   │    ├── understand-explain
   │     │  └── SKILL.md
   │    ├── understand-figma
   │     │  ├── figma-merge.mjs
   │     │  ├── figma-scan.mjs
   │     │  └── SKILL.md
   │    ├── understand-knowledge
   │     │  ├── merge-knowledge-graph.py
   │     │  ├── parse-knowledge-base.py
   │     │  └── SKILL.md
   │    ├── understand-onboard
   │     │  └── SKILL.md
   │    ├── verification-before-completion
   │     │  └── SKILL.md
   │    ├── vulnerability-scanner
   │     │  ├── checklists.md
   │     │  ├── scripts
   │     │  │  └── security_scan.py
   │     │  └── SKILL.md
   │    ├── writing-plans
   │     │  └── SKILL.md
   │    ├── writing-skills
   │     │  ├── anthropic-best-practices.md
   │     │  ├── examples
   │     │  │  └── CLAUDE_MD_TESTING.md
   │     │  ├── graphviz-conventions.dot
   │     │  ├── persuasion-principles.md
   │     │  ├── render-graphs.js
   │     │  ├── SKILL.md
   │     │  └── testing-skills-with-subagents.md
   │    └── xlsx
   │       ├── LICENSE.txt
   │       ├── recalc.py
   │       └── SKILL.md
  ├── .gitignore
  ├── .oxlintrc.json
  ├── .vercel
   │  ├── project.json
   │  └── README.txt
  ├── assets
   │  ├── icon.ico
   │  └── icon.png
  ├── electron-main.js
  ├── generate_covers.cjs
  ├── index.html
  ├── mod_assets
   │  ├── BarlowCondensed-Black.ttf
   │  ├── sounds
   │  │  └── click.wav
   │  └── textures
   │    └── gui
   │       ├── button_hover.png
   │       ├── button_normal.png
   │       ├── checkbox_off.png
   │       ├── checkbox_on.png
   │       ├── icon_e.png
   │       ├── logo.png
   │       ├── panel_card.png
   │       ├── title_banner.png
   │       ├── title_banner_elauncher_project.png
   │       ├── title_elauncher.png
   │       ├── title_elauncher_project.png
   │       ├── title_elauncher_project_minecraft.png
   │       ├── title_eternal.png
   │       ├── title_eternal_minecraft.png
   │       └── title_minecraft.png
  ├── package-lock.json
  ├── package.json
  ├── preload.cjs
  ├── public
   │  ├── bg-abstract.png
   │  ├── block_icons
   │  │  ├── amethyst.svg
   │  │  ├── anvil.svg
   │  │  ├── bed.svg
   │  │  ├── blue_ice.svg
   │  │  ├── cherry.svg
   │  │  ├── cobblestone.svg
   │  │  ├── concrete.svg
   │  │  ├── copper.svg
   │  │  ├── deepslate.svg
   │  │  ├── elytra.svg
   │  │  ├── emerald.svg
   │  │  ├── emerald_block.svg
   │  │  ├── ender_eye.svg
   │  │  ├── firefly.svg
   │  │  ├── grass.svg
   │  │  ├── honey.svg
   │  │  ├── jungle.svg
   │  │  ├── mace.svg
   │  │  ├── magma.svg
   │  │  ├── netherite.svg
   │  │  ├── pale_heart.svg
   │  │  ├── piston.svg
   │  │  ├── prismarine.svg
   │  │  ├── redstone.svg
   │  │  ├── saddle.svg
   │  │  ├── sculk.svg
   │  │  ├── sealantern.svg
   │  │  ├── spear.svg
   │  │  └── totem.svg
   │  ├── click.wav
   │  ├── favicon.svg
   │  ├── icons.svg
   │  ├── letter_e.png
   │  ├── letter_e_aligned.png
   │  ├── letter_e_tight.png
   │  ├── loaders
   │  │  ├── fabric.png
   │  │  ├── fabric.svg
   │  │  ├── fabric_site.png
   │  │  ├── forge.png
   │  │  ├── forge_fav.ico
   │  │  ├── neoforge.png
   │  │  ├── neoforge.svg
   │  │  └── vanilla.svg
   │  ├── logo.png
   │  ├── minecraft_textures
   │  │  ├── amethyst_block.png
   │  │  ├── amethyst_cluster.png
   │  │  ├── anvil.png
   │  │  ├── barrier.png
   │  │  ├── blue_ice.png
   │  │  ├── bow.png
   │  │  ├── brick.png
   │  │  ├── bundle.png
   │  │  ├── cherry_leaves.png
   │  │  ├── clock.png
   │  │  ├── cobblestone.png
   │  │  ├── command_block.png
   │  │  ├── compass.png
   │  │  ├── copper_block.png
   │  │  ├── copper_bulb.png
   │  │  ├── creaking_heart.png
   │  │  ├── cyan_concrete.png
   │  │  ├── cyan_dye.png
   │  │  ├── deepslate.png
   │  │  ├── diamond_pickaxe.png
   │  │  ├── diamond_sword.png
   │  │  ├── dirt.png
   │  │  ├── elytra.png
   │  │  ├── emerald.png
   │  │  ├── emerald_block.png
   │  │  ├── ender_eye.png
   │  │  ├── fence.png
   │  │  ├── glazed_terracotta.png
   │  │  ├── golden_apple.png
   │  │  ├── gold_block.png
   │  │  ├── grass_block.png
   │  │  ├── heart_of_the_sea.png
   │  │  ├── honeycomb_block.png
   │  │  ├── honey_block.png
   │  │  ├── iron_block.png
   │  │  ├── jungle_log.png
   │  │  ├── mace.png
   │  │  ├── magenta_glazed_terracotta.png
   │  │  ├── magma.png
   │  │  ├── netherite_block.png
   │  │  ├── piston.png
   │  │  ├── piston_top.png
   │  │  ├── poisonous_potato.png
   │  │  ├── prismarine.png
   │  │  ├── prismarine_shard.png
   │  │  ├── redstone.png
   │  │  ├── redstone_block.png
   │  │  ├── redstone_torch.png
   │  │  ├── saddle.png
   │  │  ├── sculk.png
   │  │  ├── sculk_catalyst.png
   │  │  ├── sea_lantern.png
   │  │  ├── spear.png
   │  │  ├── sponge.png
   │  │  ├── structure_block.png
   │  │  ├── tnt.png
   │  │  ├── totem_of_undying.png
   │  │  ├── trident.png
   │  │  └── writable_book.png
   │  ├── previews
   │  │  ├── preset_campfire.jpg
   │  │  ├── preset_cherry.jpg
   │  │  ├── preset_copper.jpg
   │  │  ├── preset_deepdark.jpg
   │  │  ├── preset_default.png
   │  │  ├── preset_icecaves.jpg
   │  │  ├── preset_palegarden.jpg
   │  │  └── preset_portal.jpg
   │  └── version_covers
   │    ├── 1_21_5.png
   │    ├── cover_1_12.svg
   │    ├── cover_1_13.svg
   │    ├── cover_1_14.svg
   │    ├── cover_1_15.svg
   │    ├── cover_1_16.svg
   │    ├── cover_1_17.svg
   │    ├── cover_1_18.svg
   │    ├── cover_1_19.svg
   │    ├── cover_1_20.svg
   │    ├── cover_1_21.svg
   │    ├── cover_1_21_11.svg
   │    ├── cover_1_21_4.svg
   │    ├── cover_1_21_6.svg
   │    ├── cover_1_21_9.svg
   │    ├── cover_1_7.svg
   │    ├── cover_1_8.svg
   │    ├── cover_26_1.svg
   │    ├── cover_26_2.svg
   │    ├── cover_26_3.svg
   │    ├── cover_26_4.svg
   │    └── cover_classic.svg
  ├── README.md
  ├── ROADMAP.md
  ├── scripts
   │  ├── compress_previews.ps1
   │  ├── convert_48.ps1
   │  ├── convert_ico.ps1
   │  ├── fetch_official_mc_textures.js
   │  ├── fix_square_textures.js
   │  ├── generate_barlow_titles.ps1
   │  ├── generate_block_icons.js
   │  ├── generate_title_textures.ps1
   │  ├── generate_transparent_titles.ps1
   │  ├── inspect_ico.cjs
   │  ├── list_fonts.ps1
   │  ├── measure_bounds.ps1
   │  └── transparent_forge.ps1
  ├── shader_examples
   │  ├── demo_topographic_dither.html
   │  ├── DitherWaveCanvas.tsx
   │  ├── image copy.png
   │  ├── image.png
   │  ├── README.md
   │  ├── Снимок экрана 2026-10-06 185111.png
   │  └── Снимок экрана 2026-10-06 185122.png
  ├── src
   │  ├── App.css
   │  ├── App.tsx
   │  ├── assets
   │  │  ├── hero.png
   │  │  ├── react.svg
   │  │  └── vite.svg
   │  ├── components
   │  │  ├── AnimatedText.tsx
   │  │  ├── ConsoleView.tsx
   │  │  ├── DitherWaveCanvas.tsx
   │  │  ├── InstancesView.tsx
   │  │  ├── ModsInstanceSelectModal.tsx
   │  │  ├── ModsView.tsx
   │  │  └── SettingsModalContent.tsx
   │  ├── index.css
   │  ├── main.tsx
   │  ├── types
   │  │  └── instance.ts
   │  └── utils
   │    ├── i18n.ts
   │    ├── logFilter.ts
   │    ├── sound.ts
   │    └── versionSync.ts
  ├── src-tauri
   │  ├── .gitignore
   │  ├── build.rs
   │  ├── capabilities
   │  │  └── default.json
   │  ├── Cargo.lock
   │  ├── Cargo.toml
   │  ├── icons
   │  │  ├── 128x128.png
   │  │  ├── 128x128@2x.png
   │  │  ├── 32x32.png
   │  │  ├── 64x64.png
   │  │  ├── android
   │  │  │  ├── mipmap-anydpi-v26
   │  │  │  │  └── ic_launcher.xml
   │  │  │  ├── mipmap-hdpi
   │  │  │  │  ├── ic_launcher.png
   │  │  │  │  ├── ic_launcher_foreground.png
   │  │  │  │  └── ic_launcher_round.png
   │  │  │  ├── mipmap-mdpi
   │  │  │  │  ├── ic_launcher.png
   │  │  │  │  ├── ic_launcher_foreground.png
   │  │  │  │  └── ic_launcher_round.png
   │  │  │  ├── mipmap-xhdpi
   │  │  │  │  ├── ic_launcher.png
   │  │  │  │  ├── ic_launcher_foreground.png
   │  │  │  │  └── ic_launcher_round.png
   │  │  │  ├── mipmap-xxhdpi
   │  │  │  │  ├── ic_launcher.png
   │  │  │  │  ├── ic_launcher_foreground.png
   │  │  │  │  └── ic_launcher_round.png
   │  │  │  ├── mipmap-xxxhdpi
   │  │  │  │  ├── ic_launcher.png
   │  │  │  │  ├── ic_launcher_foreground.png
   │  │  │  │  └── ic_launcher_round.png
   │  │  │  └── values
   │  │  │    └── ic_launcher_background.xml
   │  │  ├── icon.icns
   │  │  ├── icon.ico
   │  │  ├── icon.png
   │  │  ├── ios
   │  │  │  ├── AppIcon-20x20@1x.png
   │  │  │  ├── AppIcon-20x20@2x-1.png
   │  │  │  ├── AppIcon-20x20@2x.png
   │  │  │  ├── AppIcon-20x20@3x.png
   │  │  │  ├── AppIcon-29x29@1x.png
   │  │  │  ├── AppIcon-29x29@2x-1.png
   │  │  │  ├── AppIcon-29x29@2x.png
   │  │  │  ├── AppIcon-29x29@3x.png
   │  │  │  ├── AppIcon-40x40@1x.png
   │  │  │  ├── AppIcon-40x40@2x-1.png
   │  │  │  ├── AppIcon-40x40@2x.png
   │  │  │  ├── AppIcon-40x40@3x.png
   │  │  │  ├── AppIcon-512@2x.png
   │  │  │  ├── AppIcon-60x60@2x.png
   │  │  │  ├── AppIcon-60x60@3x.png
   │  │  │  ├── AppIcon-76x76@1x.png
   │  │  │  ├── AppIcon-76x76@2x.png
   │  │  │  └── AppIcon-83.5x83.5@2x.png
   │  │  ├── Square107x107Logo.png
   │  │  ├── Square142x142Logo.png
   │  │  ├── Square150x150Logo.png
   │  │  ├── Square284x284Logo.png
   │  │  ├── Square30x30Logo.png
   │  │  ├── Square310x310Logo.png
   │  │  ├── Square44x44Logo.png
   │  │  ├── Square71x71Logo.png
   │  │  ├── Square89x89Logo.png
   │  │  └── StoreLogo.png
   │  ├── src
   │  │  ├── lib.rs
   │  │  └── main.rs
   │  └── tauri.conf.json
  ├── start
  ├── topographic_dither_shaders.zip
  ├── tsconfig.app.json
  ├── tsconfig.json
  ├── tsconfig.node.json
  ├── vite.config.ts
  └── вся инфа в проекте и .md файлах, а также используй skills ОБЯЗАТЕЛЬНО ВСЕ, изучи ТОЛЬКО состояние проекта и НИЧЕГО не добавляй, просто готовся.md
```

