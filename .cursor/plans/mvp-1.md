# MVP-1 Plan: octopus-dashboard

## Project goal
Build a 3D radial file-architecture dashboard that:
- Scans ~/projects once on startup
- Renders a "you" node → tentacle → ~/projects root → ring of children
- Highlights Git-dirty folders with a pulsing glow + "!" badge
- Lets you click a folder to drill down (new ring)
- Lets you click "Back to projects" to reset
- Shows a metadata panel (path + git status) on any node click
- Has an "Open in editor" button in the panel

## Stack decisions (frozen)
- Backend: Python, stdlib only, writes backend/tree.json
- Frontend: React 18 + Vite + Three.js via @react-three/fiber
- Data contract: nested JSON tree (see CLAUDE.md for schema)
- No live file-watching in MVP-1

## Status key
- [ ] Not started
- [~] In progress
- [x] Done

---

## TASK-01 — Backend tree builder
**Status**: [ ]
**Owner**: Claude Code (terminal agent)
**Touches**: backend/ only — do not touch frontend/

### Files to create
- backend/config.py
- backend/git_status.py
- backend/build_tree.py
- backend/tests/test_build_tree.py
- backend/tests/fixtures/sample_project/ (see below)

### Exact behavior
config.py:
  ROOT_PATH = os.path.expanduser("~/projects")
  OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "tree.json")

git_status.py:
  is_git_repo(path: str) -> bool
    Returns True if path contains a .git directory
  is_dirty(path: str) -> bool
    Runs: git -C path status --porcelain
    Returns True if output is non-empty

build_tree.py:
  build_tree(root: str) -> dict
    Recursively walks root using os.walk or pathlib
    For each path builds a node matching CLAUDE.md schema
    Sets gitDirty = is_dirty(path) if is_git_repo(path), else False
  write_tree_json(tree: dict, output_path: str) -> None
    Writes json.dumps(tree, indent=2) to output_path
  if __name__ == "__main__":
    tree = build_tree(config.ROOT_PATH)
    write_tree_json(tree, config.OUTPUT_PATH)

### Fixture setup
Create backend/tests/fixtures/sample_project/ with:
  sample_project/
    readme.txt                    (plain file)
    clean_repo/                   (git init, one commit, no changes)
      main.py
    dirty_repo/                   (git init, one commit, one unstaged change)
      index.js
      unstaged_change.txt         (modified but not staged)
    plain_folder/                 (not a git repo)
      notes.md

### Done when
- python -m pytest backend/tests/ -v passes all tests
- backend/tree.json exists and matches the node schema
- gitDirty is True for dirty_repo, False for clean_repo and plain_folder

### Handoff note (fill in when done)
- Goal:
- Changes:
- Risks:
- Next owner: Agent 2 (Cursor — TASK-02)

---

## TASK-02 — Frontend Vite scaffold
**Status**: [ ]
**Owner**: Cursor Agent Window
**Touches**: frontend/ only — do not touch backend/
**Requires**: TASK-01 handoff note written

### Files to create
- frontend/ (full Vite React scaffold)
- frontend/src/components/Dashboard.jsx
- frontend/src/utils/loadTree.js

### Exact behavior
1. Run: npm create vite@latest frontend -- --template react
2. cd frontend && npm install three @react-three/fiber @react-three/drei
3. Delete src/App.css and src/assets/
4. Replace src/App.jsx with:
   import Dashboard from './components/Dashboard'
   export default function App() { return <Dashboard /> }
5. Create Dashboard.jsx:
   export default function Dashboard() { return <div>loading...</div> }
6. Create loadTree.js:
   export async function loadTree() {
     const res = await fetch('/tree.json')
     return res.json()
   }
7. Copy backend/tree.json → frontend/public/tree.json

### Done when
- npm run dev starts without errors
- Browser shows "loading..." with no console errors
- frontend/public/tree.json exists

### Handoff note (fill in when done)
- Goal:
- Changes:
- Risks:
- Next owner: Agent 3 (Cursor — TASK-03)

---

## TASK-03 — Three.js radial scene
**Status**: [ ]
**Owner**: Cursor Agent Window
**Touches**: frontend/src/ only
**Requires**: TASK-02 handoff note written

### Files to create
- frontend/src/utils/buildRingLayout.js
- frontend/src/components/ThreeScene.jsx (new)
- frontend/src/components/Dashboard.jsx (update)

### Exact behavior
buildRingLayout.js:
  export function buildRingLayout(children, radius = 4)
  Returns: [ { node, position: [x, y, z] }, ... ]
  Positions nodes evenly in a circle on the XZ plane (y = 0)
  Formula: x = radius * cos(i * 2π / n), z = radius * sin(i * 2π / n)

ThreeScene.jsx:
  - Wraps everything in @react-three/fiber <Canvas>
  - On mount: calls loadTree(), stores result in useState
  - Renders:
    a. "You" sphere at [0, 0, 0], color #FFFFFF, radius 0.3
    b. Line from [0,0,0] to [0,0,-3] (tentacle)
    c. ~/projects sphere at [0, 0, -3], color #4A90D9, radius 0.4
    d. Direct children of root: buildRingLayout(root.children, 4)
       Each child rendered as a sphere at its layout position
  - Camera: starts at [0, 0, 1], animates to [0, 2, 10] over 2 seconds
    Use useFrame + a lerp function for smooth animation

Dashboard.jsx update:
  - Import and render <ThreeScene />
  - Remove the placeholder "loading..." div

### Done when
- npm run dev shows:
  - Black canvas
  - White "you" sphere at center
  - Blue "projects" sphere behind it
  - Ring of child spheres around it
  - Zoom-out animation plays on load
- No console errors

### Handoff note (fill in when done)
- Goal:
- Changes:
- Risks:
- Next owner: Agent 4 (Cursor — TASK-04)

---

## TASK-04 — Node meshes + glow
**Status**: [ ]
**Owner**: Cursor Agent Window
**Touches**: frontend/src/components/ only
**Requires**: TASK-03 handoff note written

### Files to create
- frontend/src/components/NodeMesh.jsx (new)
- frontend/src/components/ThreeScene.jsx (update — use NodeMesh)

### Exact behavior
NodeMesh.jsx:
  Props: { node, position, onClick }

  If node.type === "folder":
    Render <mesh> with <torusGeometry args={[0.4, 0.1, 16, 100]} />
    Color: #4A90D9 (blue) if clean, #FF8C00 (orange) if gitDirty

  If node.type === "file":
    Render <mesh> with <sphereGeometry args={[0.1, 16, 16]} />
    Color: #AAAAAA (gray)

  If node.gitDirty === true:
    Wrap in a group
    Add <pointLight color="#FF8C00" intensity={pulsingValue} distance={2} />
    Add <Text position={[0, 0.6, 0]} fontSize={0.3} color="#FF8C00">!</Text>
    Pulse: use useFrame + Math.sin(clock.elapsedTime * 2) mapped to 0→1 range

  All nodes: call onClick(node) on click event

ThreeScene.jsx update:
  Replace raw <mesh> sphere renders with <NodeMesh> for all child nodes
  Pass onClick handler that:
    - For now just logs the node path (Panel comes in TASK-05)

### Done when
- Folders render as rings, files as dots
- Dirty nodes pulse orange with "!" badge
- Clean nodes are blue/gray, no animation
- No performance issues for up to 50 nodes

### Handoff note (fill in when done)
- Goal:
- Changes:
- Risks:
- Next owner: Agent 5 (Cursor — TASK-05 + TASK-06)

---

## TASK-05 + TASK-06 — Panel + click + back button
**Status**: [ ]
**Owner**: Cursor Agent Window
**Touches**: frontend/src/components/ only
**Requires**: TASK-04 handoff note written

### Files to create
- frontend/src/components/Panel.jsx (new)
- frontend/src/components/BackToProjectsButton.jsx (new)
- frontend/src/components/ThreeScene.jsx (update)

### Exact behavior
Panel.jsx:
  Props: { node, onClose }
  Rendered as an HTML overlay (position: absolute, top-right or bottom-left)
  Shows:
    - Path: node.path
    - Type: node.type
    - Git status: node.gitDirty ? "Dirty (uncommitted changes)" : "Clean"
  Buttons:
    - "Open in editor": console.log("open:", node.path) for now
    - "Close": calls onClose()

BackToProjectsButton.jsx:
  Props: { onReset }
  Rendered as an HTML button (position: fixed, top: 16px, right: 16px)
  Label: "← Back to projects"
  On click: calls onReset()
  Only visible when currentRoot is not the ~/projects root

ThreeScene.jsx updates:
  State:
    - selectedNode: null | node (for Panel)
    - currentRoot: root node from tree.json initially
  On folder NodeMesh click:
    - Set currentRoot to clicked folder node
    - Rebuild the ring using currentRoot.children via buildRingLayout
    - Animate camera back to [0, 2, 10]
  On file NodeMesh click:
    - Set selectedNode to clicked file node
    - Panel appears
  Panel onClose:
    - Set selectedNode to null
  BackToProjectsButton onReset:
    - Set currentRoot back to original root (store originalRoot in a ref)
    - Animate camera to [0, 2, 10]

### Done when (full happy path)
1. Open dashboard → zoom-out animation plays → ring visible
2. A dirty folder glows + shows "!" badge
3. Click dirty folder → ring rebuilds with that folder's children
4. Hover any node → metadata panel appears
5. Click "Open in editor" → console.log fires with correct path
6. Click "← Back to projects" → ring resets to ~/projects children
7. Click a file node → panel shows file path and type
8. All npm test assertions pass

### Handoff note (fill in when done)
- Goal:
- Changes:
- Risks:
- Next owner: YOU — validate happy path and commit

---

## What you do after every task

1. Read the handoff note the agent wrote.
2. Run the tests:
   - cd backend && python -m pytest tests/ -v
   - cd frontend && npm test
3. Open the app: cd frontend && npm run dev
4. Manually check the done-when conditions for that task.
5. If anything fails → paste the error into a new agent session with:
   "Read CLAUDE.md and mvp-1.md. Fix this error: [paste error]"
6. Once passing → git add -A && git commit -m "feat: TASK-0X done"
7. Update the status in this file from [ ] to [x].
8. Start the next agent.

## Common failures and how to handle them

| Symptom | Fix |
|---|---|
| Agent touched the wrong layer | Roll back with git checkout, restart agent |
| tree.json schema mismatch | Fix build_tree.py, re-run, re-copy to frontend/public/ |
| npm run dev crashes | Check console for missing imports, ask Cursor agent |
| Tests failing after agent edit | Paste error into new agent: "fix this test failure" |
| Two agents conflict on same file | Run sequentially, commit between each task |

---

## FIXTURE HANDOFF
- Goal: created test fixtures with one clean repo and one dirty repo
- Changes: backend/tests/fixtures/sample_project/ created
- Verified: git status confirmed clean_repo is clean, dirty_repo is dirty
- Risks: none
- Next: PROMPT 2 — backend config + git helpers

---

## GIT HELPERS HANDOFF
- Goal: wrote config.py and git_status.py
- Verified: all 6 is_git_repo/is_dirty checks pass on fixtures
- Changes: backend/config.py, backend/git_status.py
- Risks: subprocess timeout is 5s — may be slow on network-mounted paths
- Next: PROMPT 3 — build_tree.py

---

## TREE BUILDER HANDOFF
- Goal: wrote build_tree.py, produces correct nested JSON tree
- Verified: smoke tests pass, gitDirty correct on fixtures, tree.json written
- Changes: backend/build_tree.py, backend/tree.json
- Risks: deeply nested repos may be slow — acceptable for MVP-1
- Next: PROMPT 4 — backend tests

---

## TESTS HANDOFF
- Goal: full pytest suite passes for build_tree.py
- Verified: all 7 tests pass
  ```
  tests/test_build_tree.py::test_root_node_shape PASSED
  tests/test_build_tree.py::test_gitDirty_true_for_dirty_repo PASSED
  tests/test_build_tree.py::test_gitDirty_false_for_clean_repo PASSED
  tests/test_build_tree.py::test_gitDirty_false_for_plain_folder PASSED
  tests/test_build_tree.py::test_file_nodes_never_dirty PASSED
  tests/test_build_tree.py::test_hidden_files_excluded PASSED
  tests/test_build_tree.py::test_write_tree_json PASSED
  7 passed in 0.03s
  ```
- Changes: backend/tests/test_build_tree.py, backend/conftest.py (adds project root to sys.path so `from backend.*` imports resolve when pytest runs from backend/)
- Risks: none
- Next: YOU — commit, copy tree.json, then run PROMPT 5 (frontend scaffold)

---

## SCAFFOLD HANDOFF
- Goal: Vite + React + Three.js scaffold running with no errors
- Verified: npm run dev shows black screen + loading text, no console errors
- Changes: frontend/ (full scaffold), frontend/public/tree.json copied
- Risks: if tree.json is missing from public/, ThreeScene will 404
- Next: PROMPT 6 — Three.js radial scene

---

## SCENE HANDOFF
- Goal: 3D radial scene renders with zoom-out animation and ring of children
- Verified: camera animation plays, ring visible, no console errors
- Changes: ThreeScene.jsx, buildRingLayout.js, Dashboard.jsx (updated)
- Risks: ring may be empty if tree.json has no children at root level
- Next: PROMPT 7 — node meshes + glow

---

## MESH HANDOFF
- Goal: folders = torus, files = dot, dirty nodes pulse orange with "!" badge
- Verified: visual confirmed in browser, click events logged, no errors
- Changes: NodeMesh.jsx (new), ThreeScene.jsx (updated)
- Risks: pulsing light may be subtle on dark backgrounds — intentional
- Next: PROMPT 8 — panel + folder click + back button

---

## MVP-1 COMPLETE HANDOFF
- Goal: full happy path works end-to-end
- Verified: all 8 happy-path steps confirmed in browser
- Changes: Panel.jsx, BackToProjectsButton.jsx, ThreeScene.jsx (final update)
- Risks:
    - "Open in editor" is stubbed (console.log only) — needs real terminal call
    - No error state if tree.json is missing or malformed
    - Performance not tested beyond ~50 nodes
- Next: YOU — final commit, tag v0.1.0, celebrate

---

## PROMPT 9 HANDOFF — Backend API + SSE + Settings
- Status: COMPLETE
- Verified: 14 tests passing, all 5 curl checks pass
- New files: backend/api.py, ~/.config/octopus-dashboard/settings.json
- Modified: backend/config.py, backend/build_tree.py, .gitignore
- Machine ID: uptonogood
- API running on: http://localhost:7823
- SSE scan endpoint: GET /scan (scanned 639 dirs, emitted 26 progress events)
- Next: PROMPT 10 — frontend lazy loading + scan button + API integration
- Risks: First scan of /home/uptonogood/.config may be slow if deeply nested

---

## PROMPT 10 HANDOFF — Frontend API Integration + Scan Button
- Status: COMPLETE
- Verified: build clean (577 modules, 0 errors), all 14 Vitest tests pass, manual checklist done
- New files: ScanButton.jsx, ScanTimestamp.jsx
- Modified: loadTree.js, ThreeScene.jsx, Dashboard.jsx, NodeMesh.jsx
- API base: http://localhost:7823
- SSE scan: live progress via EventSource
- Next: PROMPT 11 — expanded attention signals
  (gitUnpushed, recentlyModified, noReadme, dormant)

---

## PROMPT 11 HANDOFF — Expanded Attention Signals
- Status: COMPLETE
- Verified: 23 backend tests pass, 20 frontend tests pass, build clean (578 modules, 0 errors)
- New files: backend/signals.py, backend/tests/test_signals.py, frontend/src/utils/signals.js, frontend/src/__tests__/signals.test.js
- Modified: backend/git_status.py (added is_unpushed, has_readme), backend/build_tree.py (uses compute_signals), frontend/src/components/NodeMesh.jsx (signal-aware color/glow), frontend/src/components/Panel.jsx (colored signal dots)
- Signal priority: gitUnpushed > gitDirty > noReadme > recentlyModified > dormant
- Backward compat: gitDirty field preserved on all nodes
- Risks:
  - recentlyModified/dormant thresholds come from config; defaults are 3 days / 90 days
  - "Open in editor" is still stubbed (console.log only)
- Next: PROMPT 12 — breadcrumb + dimmed parent node

---

## PROMPT 12 HANDOFF — Breadcrumb + Dimmed Parent Node
- Status: COMPLETE
- Verified: build clean (579 modules, 0 errors), all 25 Vitest tests pass, visual check done
- New files: Breadcrumb.jsx, frontend/src/__tests__/Breadcrumb.test.jsx
- Modified: ThreeScene.jsx (navStack replaces currentRoot state, SceneObjects gets parentNode prop)
- Navigation model: navStack array, crumb click slices stack with prev.slice(0, idx + 1)
- Parent node: position [0,0,3], scale 0.55, opacity 0.35, not interactive
- Breadcrumb hidden at root (navStack.length <= 1), truncates to first+...+last3 beyond 5 crumbs
- buildCrumbList exported as pure function for testing without jsdom
- Next: PROMPT 13 — UX polish + open actions + Ctrl+K search

---

## PROMPT 13 HANDOFF — UX Polish + Open Actions + Ctrl+K Search
- Status: COMPLETE
- Verified: 25 backend tests pass, 33 frontend tests pass, build clean (582 modules, 0 errors)
- New files: NodeTooltip.jsx, NodeSearch.jsx, frontend/src/utils/searchTree.js,
  backend/tests/test_open.py, frontend/src/__tests__/NodeTooltip.test.js,
  frontend/src/__tests__/NodeSearch.test.js
- Modified: api.py (/open endpoint + POST CORS), loadTree.js (openNode), Panel.jsx
  (3 open buttons + status feedback), NodeMesh.jsx (pointer events + onDoubleClick),
  ThreeScene.jsx (click model, tooltip state, search state), Breadcrumb.jsx (hover effects)
- Click model: single click = select (panel), double click = drill in / open editor
- Open actions: cursor / dolphin / konsole via POST /open — fire-and-forget with 2s confirmation
- Ctrl+K search: searches in-memory shallow tree, keyboard nav, Enter to jump + open panel
- findAncestorStack walks loaded tree to reconstruct navStack on search select
- getTooltipLines and buildCrumbList exported as pure functions for jsdom-free testing
- Next: PROMPT 14 — startup polish + v0.2.0

---

## PROMPT 14 HANDOFF — Startup Polish + v0.2.0
- Status: COMPLETE
- Verified: start.sh syntax ok, 25 backend tests pass, 34 frontend tests pass, build clean
- Tag: v0.2.0 (also has v0.1.0)
- New files: start.sh, CHANGELOG.md, BackendError.jsx,
  frontend/src/__tests__/BackendError.test.js
- Modified: App.jsx (health gate + BackendError), api.py (lifespan startup scan,
  app.state.tree replaces _tree_cache, /tree serves cache for shallow depth),
  index.html (title), ThreeScene.jsx (gl.pixelRatio)
- Startup scan runs in ThreadPoolExecutor at lifespan, logs node count
- /tree short-circuits from app.state.tree when depth == SHALLOW_DEPTH
- BackendError exports ERROR_HEADING constant for jsdom-free testing
- Auto-retry countdown: local state in BackendError, resets on each manual/auto retry
- Next: PROMPT 15-UX — layout fix + open actions + context menu + labels

---

## PROMPT 15-UX HANDOFF — Layout Fix + Open Actions + Context Menu + Labels
- Status: COMPLETE
- Verified: 37 frontend tests pass, build clean (584 modules, 0 errors)
- New files: NodeContextMenu.jsx, frontend/src/__tests__/NodeContextMenu.test.js
- Modified: index.css (full-viewport reset, removed 1126px constraint),
  App.jsx (viewport wrapper), Dashboard.jsx (100% relative container),
  Panel.jsx (per-action status map, real openNode calls, 3 buttons),
  NodeMesh.jsx (Html label + onContextMenu), ThreeScene.jsx (context menu
  state, canvas wrapper div, handleDrillIn extracted),
  Breadcrumb.jsx / BackToProjectsButton.jsx / ScanButton.jsx /
  ScanTimestamp.jsx (unified pill style, consistent positions)
- Layout: index.css reset removes Vite default 1126px #root constraint
- Open actions: per-action status map { [action]: idle|opening|ok|error }
- Context menu: getMenuItems(node) exported pure fn; outside-click closes via useEffect
- Node labels: Html from drei at position [0,-0.75,0], distanceFactor 8, pointer-events none
- handleDrillIn extracted so both double-click and context menu "Drill" share same logic
- Next: PROMPT 16 — animations (entrance, camera lerp, idle pulse)

---

## PROMPT 16 HANDOFF — OCTO Rebrand + Tentacle Geometry + Design System
- Status: COMPLETE
- Verified: 42 frontend tests pass, 25 backend tests pass, build clean (0 errors)
- New files: OctoWordmark.jsx, Tentacle.jsx, utils/buildTentacleLayout.js,
  src/__tests__/buildTentacleLayout.test.js
- Modified: index.html, index.css, App.jsx, Dashboard.jsx, Breadcrumb.jsx,
  ThreeScene.jsx, Panel.jsx, ScanButton.jsx, ScanTimestamp.jsx,
  NodeContextMenu.jsx, NodeMesh.jsx, BackToProjectsButton.jsx,
  backend/api.py
- TASK A: _resolve_cmd(preferred) checks hardcoded candidates then shutil.which;
  /open endpoint is sync def (not async) for test compat with test_open.py
- TASK B: OctoWordmark is two-span (OCTO + uptonogood), fixed top-left z=150;
  Breadcrumb shows "OCTO" for node.type==='you' (not index===0, to pass existing tests);
  title "OCTO — uptonogood"
- TASK C: buildTentacleLayout → {node, endPosition: Vector3, curve: CatmullRomCurve3(4 pts)};
  XY-plane spread (z=0); Tentacle is tube-only (no sphere/label); SceneObjects renders
  Tentacle + NodeMesh at endPosition; hoveredId state in SceneObjects drives tentacle hovered prop;
  swayTentacle uses += (matches spec) — Tentacle resets points[1] to originalMid each frame
  before calling swayTentacle, preventing drift; threshold dx/dy>0.004 gates rebuild
- TASK D: index.css has @keyframes fadeIn+scanPulse; bg #050508; Panel close "×" abs top-right,
  glass blur 16px; BackToProjectsButton label "← root" with hover glow; ScanTimestamp
  color rgba(74,144,217,0.35); NodeMesh default emissiveIntensity 0.06/0.22(signal)/0.45(hover);
  Canvas antialias+onCreated+camera [0,4,10] fov 55
- Next: PROMPT 17 — spherical layout + camera rig

---

## PROMPT 17 HANDOFF — Spherical Layout + Camera Rig + Sway Fix
- Status: COMPLETE
- Verified: 44 frontend tests pass, 25 backend tests pass, build clean (586 modules)
- Root cause fixed: XY-plane flat layout → Fibonacci sphere distribution (golden angle spacing)
- Sway drift fixed: swayTentacle resets via .copy(basePoints[i]) before adding offset; safe every frame
- Click targets fixed: NodeMesh now uses sphereGeometry args=[0.38, 32, 32] for all nodes;
  signal nodes scale 1.1; label at [0, -0.55, 0]; torus removed
- Camera: CameraRig auto-rotates (delta * 0.08 rad/s), spring-lerps to target (exp decay k=2.5),
  nudges toward hovered node endPosition (0.08 pull factor); no OrbitControls
- Lights: center pointLight [0,0,0] intensity 2.0 distance 12 creates depth falloff;
  top fill [0,8,0] white; rim [-6,-4,-8] dark purple
- Layout: buildTentacleLayout returns {node, endPosition, curve, basePoints}; pole guard
  for perpRaw.lengthSq() < 1e-6; layout memoized in SceneObjects on [currentRoot]
- Tentacle: takes basePoints prop, passes to swayTentacle; tube-only, no sphere/label
- ThreeScene: hoveredEndPos state → CameraRig; onHoverPosition → SceneObjects → setHoveredEndPos
- Next: PROMPT 18 — entrance animation + drill-in transition
---

## PROMPT 18 HANDOFF — Entrance Animations + Drill Transitions + Idle Pulse
- Status: COMPLETE
- Verified: 44 frontend tests pass, 25 backend tests pass, build clean (0 errors)
- useAnimationClock.js: new useRevealProgress(revealKey, duration) hook — rAF loop,
  ease-out-cubic (1 - (1-p)^3), restarts on revealKey change, jumps to 1 for prefers-reduced-motion
- Tentacle entrance: sub-curve sampling via curve.getPoint((j/n) * localP) draws first
  localP fraction; staggered per node (delay = i * 0.045); revealStartRef tracks clock
  start time; geometry rebuilt every 3 frames, old disposed; hidden until localP >= 0.02
- NodeMesh fade-in: nodeProgress = clamp((revealProgress*1.2 - delay) / 0.4, 0, 1);
  opacity=nodeProgress, transparent when <1; synced to tentacle reveal
- Center node idle breathe: centerRef + useFrame, scale = 1 + sin(t * 2π/3.5) * 0.03
- Drill trigger: revealKey state in ThreeScene, incremented via useEffect on currentRoot
  change; passed as ringKey to SceneObjects → useRevealProgress resets → animation restarts
- CSS: fadeIn updated to translateY(6px); added nodeReveal (scale 0.7→1) and breathe keyframes
- Next: PROMPT 19 — node search, keyboard nav, or further scene polish

---

## PROMPT 19 HANDOFF — Bioluminescence Palette + Semantic Colors + Responsive Camera
- Status: COMPLETE
- Verified: 44 frontend tests pass, 25 backend tests pass, build clean (0 errors, 588 modules)
- New: frontend/src/utils/palette.js — single source of truth; PALETTE constants + getNodeColor(node)
- Semantic colors: folder=#c8a2ff (violet), file=#4ecdc4 (teal), signal=#ff6b6b (coral), selected=#f9e94e (gold)
- NodeMesh: uses getNodeColor(); isSelected prop turns node gold; emissiveIntensity 0.35/0.4/0.8;
  label font upgraded to Outfit 11px 500 weight with color glow text-shadow
- Tentacle: material color '#030308' dark base, emissive=nodeColor from SceneObjects,
  emissiveIntensity 0.2/0.7 (idle/hover), opacity 0.5/0.9
- ThreeScene: responsive radius via useThree().viewport.aspect × nodeCount formula (4.5–7.5);
  CameraRig pulls back to r=13 on viewports <900px wide; Canvas gl.setClearColor('#03030a'),
  setPixelRatio(min(dpr,2)), alpha:false, fov:52, resize:{debounce:50}
- Lights: ambientLight 0.5 #08083a; center white pointLight 3.0; top blue #7c9df5 0.6;
  bottom violet #c8a2ff 0.4 — three-color lighting gives surface depth variation
- OctoWordmark: 8-arm SVG glyph (16×16 radial lines + center circle) + full subtitle
  "Organizational Code Topology Observer" with truncation on narrow viewports
- Panel: borderLeft=2px solid nodeColor; title text=nodeColor; glow box-shadow
- All components: #4A90D9/rgba(74,144,217,...) → #7c9df5/rgba(124,157,245,...) throughout
- CSS: full reset with :root custom properties, Outfit @import, selection/scrollbar tokens
- Next: PROMPT 20 — entrance animations search overlay, or further feature work

---

## PROMPT 20 HANDOFF — Bug Fixes, Zoom, Depth, UI Polish
- Status: COMPLETE
- Verified: 44 frontend tests pass, 25 backend tests pass, build clean (0 errors)
- Fixed: getNodeColor all-red bug — root cause was dominantSignal='dormant' on most folders
  (Linux dir mtime is old since it only updates on direct-child add/remove, not deep file edits).
  Fix: ALERT_SIGNALS = Set(['gitDirty','gitUnpushed']); only these two change node color to red.
  noReadme/dormant/recentlyModified remain informational — they still show the ! badge but keep
  the node's type color (violet for folder, teal for file).
- Fixed: scroll-to-zoom — CameraRig gets zoomRef (range 0.45×–3.5×) + passive-false wheel event.
  Camera baseR and height both scale by zoomRef.current.
- Fixed: FOV 62° (was 52°), radius 3.8–6.0 (was 4.5–7.5), aspect-ratio correction removed.
- Added: StarField — 280 random points on sphere r=30–50, subtle #8888cc at 0.4 opacity.
- Added: Grid from @react-three/drei at y=-6 with fadeDistance=20 for spatial grounding.
- Added: ZoomHint HUD — appears at bottom-right for 3.5s then fades out via fadeOut keyframe.
- Added: Node size encodes data — folders scale 0.30–0.55 by childCount, files 0.22–0.45 by size.
  Signal nodes get +15% radius bump instead of scale prop.
- Redesigned: Panel — border-top replaces border-left, Outfit 15px title, blur(20px) saturate(180%).
- Polished: Breadcrumb — bg rgba(8,8,20,0.75), blur(12px), separator rgba opacity.
- Added: @keyframes fadeOut to index.css.
- Next: PROMPT 21 — further features or polish

---

## PROMPT 21 HANDOFF — Keyboard Shortcuts + Tooltip + Label Hide
- Status: COMPLETE
- Verified: 47 frontend tests pass (3 new), 25 backend tests pass, build clean
- New: Comprehensive keydown handler — ⌘K toggles search, Esc closes search then panel,
  Backspace/← navigates up one level when parentNode exists, Enter drills into/opens selected node.
  Handler guards against INPUT/TEXTAREA targets; deps array: [searchOpen, selectedNode, parentNode, handleNodeDoubleClick]
- New: KeyboardLegend "?" button fixed bottom-left. Circular pill, toggle on click, overlay
  lists all shortcuts as <kbd> chips. Positioned at bottom:56 left:20.
- New: NodeTooltip redesigned — accepts {node, x, y} props, left border = node type color,
  shows type icon (⬡/◈), node name, active signal labels (up to 3), child count for folders,
  "not loaded" for lazy folders. Smart viewport clamping: min(x+14, innerWidth-228).
  Kept getTooltipLines() export unchanged for existing tests.
- New: NodeMesh showLabel prop — label Html hides when showLabel=false. SceneObjects passes
  showLabel={hoveredId !== node.id} so the static label disappears when tooltip is showing.
- Entrance animation: already implemented in PROMPT 17/18 — useRevealProgress(ringKey, 1200),
  Tentacle grow-from-center with stagger delay=i*0.045. Confirmed working.
- Tests: keyboard.test.js — 3 pure logic tests for Esc priority, Backspace with/without parent
- Next: PROMPT 22 — signal detail drawer + node search upgrade

---

## PROMPT 21-HOTFIX — Black screen fix (commit 5e6195e)

**Root cause:** React hooks ordering violation / temporal dead zone crash.
`useEffect` on line 342 included `handleNodeDoubleClick` in its dependency array,
but `handleNodeDoubleClick` was defined with `useCallback` at line 402 (after the
`useEffect` call). JavaScript `const` is in the TDZ until its binding statement
executes — evaluating the deps array `[..., handleNodeDoubleClick]` before line 402
throws `ReferenceError: Cannot access 'handleNodeDoubleClick' before initialization`,
crashing the component on every first render.

**Fix:** Moved `revealKey` state, `handleDrillIn`, `handleNodeClick`,
`handleNodeDoubleClick`, and `handleSearchSelect` to before the keyboard
shortcut `useEffect`. No logic changes — pure reorder.

- Verified: 47 frontend tests pass, build clean, scene renders again

---

## PROMPT 23 HANDOFF — Minimap + Pinned Favorites (commit 88296aa)
- Status: COMPLETE
- New: Minimap component — 2D Canvas, top-down XZ projection,
  DPR-aware, animated per-frame via rAF, click-to-select, concentric rings,
  glow on hovered/selected dots. Positioned bottom-right (154×154px).
- New: layout and hoveredId lifted from SceneObjects to ThreeScene state.
  SceneObjects gains onLayoutReady (calls setLayout), hoveredId prop, and
  onHoveredChange (calls setHoveredId). setLayout/setHoveredId are stable
  useState setters — no stale closure or infinite loop risk.
- New: PinTray — pill row fixed bottom-center, per-session memory,
  jump (navigates tree via findAncestorStack) + unpin × button on hover.
  Renders null when pins empty — no empty bar.
- New: Pin/unpin via Panel ☆/★ button (top:14 right:36, yellow when pinned)
  and context menu "☆ Pin to tray" / "★ Unpin" item.
- New: handlePin, handleUnpin, handleJump useCallbacks in ThreeScene.
  handleJump uses findAncestorStack — same pattern as handleSearchSelect.
- New: pins.test.js — 4 tests for pinReducer (pin, no-dup, unpin, no-op).
- Layout: Minimap right:20, PinTray center max-width calc(100vw-220px),
  KeyboardLegend left:20 — three fixed-bottom elements don't overlap.
- Tests: 51/51 passing (47 existing + 4 new). 25 backend tests pass.
- Build clean.
- Next: PROMPT 24 — file preview in Panel + git diff summary
