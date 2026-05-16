---
"ghostdeps": minor
---

Add an interactive graph view powered by `@xyflow/react` and `dagre`. The dependency canvas now ships with a Tree / Graph toggle: the tree view is the existing indented list, while the graph view renders a zoomable, pannable top-to-bottom DAG with auto-layout, a minimap, and custom nodes that surface health, supply-chain warnings, and selection state. Critical-health edges animate. The graph bundle is dynamically imported so the home screen and SSR routes stay light.
