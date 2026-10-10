# Strict Rule: Mandatory Graphify Knowledge Base Priority

1. **Mandatory First Step for Architecture & Navigation**:
   - At the beginning of EVERY conversation, task, or question regarding architecture, components, functions, and state:
     The AI agent MUST FIRST read graphify-out/GRAPH_REPORT.md and consult graphify-out/graph.json.
   - It is strictly FORBIDDEN to perform broad recursive list_dir or read dozens of source files blindly.

2. **Targeted Code Navigation (40-50% Token Reduction)**:
   - Identify the exact component or function node in graphify-out/GRAPH_REPORT.md / graphify-out/graph.json.
   - Open ONLY that specific file via iew_file to view or edit the needed lines.
   - For visual navigation, the interactive graph is hosted at graphify-out/graph.html.
