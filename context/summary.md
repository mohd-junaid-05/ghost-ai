# Ghost AI — Project Summary

> A personal record of everything built, every technology learned, and every skill developed while building this project from scratch.

---

## What Is This Project?

**Ghost AI** is a real-time collaborative system design workspace. Users describe a software architecture in plain English, an AI agent maps it onto a shared visual canvas, collaborators can refine it together live, and the app generates a complete Markdown technical specification from the final graph.

Think of it as a **Figma + AI + system design** tool — built entirely by hand.

---

## The Full Tech Stack

| Layer | Technology | What I Learned |
|---|---|---|
| Framework | **Next.js 16** + TypeScript | App Router, Server Components, dynamic params as Promises |
| UI Library | **shadcn/ui** + Tailwind CSS v4 | Component composition, design tokens, CSS custom properties |
| Authentication | **Clerk** | Middleware, route protection, server-side `auth()`, `currentUser()`, backend API for user enrichment |
| Database ORM | **Prisma v7** + PostgreSQL | Schema splitting, v7 adapter pattern, migrations, singleton client |
| Realtime Collaboration | **Liveblocks** + React Flow | Rooms, presence, storage, cursors, `useMutation`, `useOthers`, auth token issuance |
| Canvas Engine | **React Flow (xyflow)** | Custom nodes, custom edges, NodeToolbar, NodeResizer, ViewportPortal, drag-and-drop |
| Background Tasks | **Trigger.dev v4** | Durable task authoring, schema tasks, background job triggering |
| Artifact Storage | **Vercel Blob** | Private blob uploads, URL references, explicit token passing |
| Icons | **Lucide React** | Stroke-based icon system, consistent sizing conventions |

---

## 22 Feature Units Completed (In Order)

### 01 — Design System
- Initialized **shadcn/ui** with 7 UI primitive components.
- Built a full **dark-only design token system** in `globals.css` with CSS custom properties for background, surface, border, text, brand, AI accent, and state colors.
- Mapped all tokens to Tailwind utilities via `@theme inline`.
- **Learned**: How to build a proper design token architecture instead of scattering hex values everywhere.

---

### 02 — Editor Chrome
- Created `EditorNavbar` and `ProjectSidebar` components.
- Implemented sidebar toggle with animated open/close icons (`PanelLeftOpen` / `PanelLeftClose`).
- `EditorShell` owns all layout state as the parent orchestrator.
- **Learned**: How to structure a shell/layout component that coordinates multiple child UI zones.

---

### 03 — Authentication
- Integrated **Clerk** for full auth: `ClerkProvider`, middleware (`proxy.ts`), sign-in/sign-up pages.
- Built a two-panel auth layout (branding left, form right) responsive to mobile.
- Protected all routes with Clerk's protected-first middleware.
- Fixed **Turbopack env var injection** bug — `NEXT_PUBLIC_` vars must be explicitly passed to `<ClerkProvider>` for Turbopack to include them in the client bundle.
- **Learned**: How Clerk middleware works, route group isolation with `(auth)`, and how Turbopack differs from Webpack for env vars.

---

### 04 — Project Dialogs
- Created three full dialogs: **Create** (with live slug preview), **Rename** (auto-focus, Enter to submit), **Delete** (destructive confirmation).
- Built `useProjectDialogs` hook for centralized dialog state management.
- Used `ProjectDialogsContext` for cross-component dialog triggering without prop drilling.
- Fixed timer leak bug: `pendingTimerRef` tracks every `setTimeout` and cancels it on close.
- **Learned**: Context + hook pattern for shared UI state. Timer management with `useRef`.

---

### 05 — Prisma Setup
- Set up **Prisma v7** with PostgreSQL and the required adapter pattern.
- Split schema into `prisma/schema.prisma` (generator/datasource) and `prisma/models/project.prisma` (models).
- Built `Project` and `ProjectCollaborator` models with cascade deletes, proper indexes, and unique constraints.
- Handled the **Prisma Accelerate branch**: detects `prisma+postgres://` prefix in `DATABASE_URL` and conditionally applies `withAccelerate()`.
- Fixed **SSL deprecation warning** by changing `sslmode=require` to `sslmode=verify-full`.
- **Learned**: Prisma v7's breaking change (adapter is now required), schema splitting, Accelerate extension, SSL mode semantics.

---

### 06 — Project REST APIs
- Built 4 REST endpoints: `GET`, `POST`, `PATCH`, `DELETE` for projects.
- Enforced **auth at every boundary**: 401 for unauthenticated, 403 for non-owners.
- Used `auth()` from `@clerk/nextjs/server` (not `auth.protect()` which returns 404 on APIs).
- Learned the **Next.js 16 breaking change**: dynamic params are now `Promise<{ param: string }>`.
- **Learned**: Thin route handler pattern, consistent response shapes, proper HTTP status codes.

---

### 07 — Wire Editor Home
- Connected the editor home page to real database data.
- Built `lib/data/projects.ts` server-side data helper using Prisma + Clerk `auth()`.
- `app/editor/page.tsx` is an **async Server Component** — no `"use client"`, no `useEffect`.
- Fixed collaborator access bug: was querying by `userId` instead of the user's email address.
- **Learned**: How to fetch data in Server Components, pass it as props to Client Components, and keep pages lean.

---

### 08 — Editor Workspace Shell
- Built the `/editor/[roomId]` workspace page with three zones: sidebar, canvas, AI sidebar.
- Created `lib/project-access.ts` for ownership + collaborator access checks.
- Built `<AccessDenied />` component for unauthorized users.
- Made the canvas fill 100% of the viewport under the navbar.
- **Learned**: Multi-zone layout with absolute/fixed positioning, access control as a shared library.

---

### 09 — Share Dialog
- Built full workspace sharing: invite by email, list collaborators, remove collaborators.
- Used **Clerk Backend API** (`createClerkClient`) to batch-enrich collaborator emails with display names and avatar images.
- Implemented one-click URL copy with visual feedback.
- **Learned**: How to use Clerk's backend API server-side, batch enrichment patterns, copy-to-clipboard UX.

---

### 10 — Liveblocks Setup
- Configured global TypeScript typings for **Liveblocks** (`Presence`, `UserMeta`).
- Built the authenticated `/api/liveblocks-auth` route: verifies Clerk session → checks project access → calls `liveblocks.identifyUser`.
- Created a deterministic **hash-to-color helper** to consistently assign cursor colors to users.
- Fixed **HMR cache invalidation**: Liveblocks client on `globalThis` now tracks the env key and recreates if it changes.
- **Learned**: Liveblocks auth flow, room token issuance, presence type system, deterministic color assignment.

---

### 11 — Base Canvas
- Wired **Liveblocks + React Flow** for a live collaborative canvas.
- Set up `CanvasWrapper` with `LiveblocksProvider`, `RoomProvider`, `ClientSideSuspense`, and `ErrorBoundary`.
- Built `useLiveblocksFlow` integration with custom node/edge types.
- Added `<Cursors />` overlay and `<MiniMap />`.
- **Learned**: How Liveblocks Storage integrates with React Flow, provider hierarchy, suspense loading states, custom canvas types.

---

### 12 — Shape Panel
- Built a **floating shapes toolbar** at the bottom of the canvas with 6 draggable shape buttons.
- Implemented **HTML5 drag and drop** with precise coordinate translation using `screenToFlowPosition`.
- Registered a custom `canvasNode` type for React Flow.
- **Learned**: HTML5 drag events, coordinate system translation between screen space and flow space, custom React Flow node registration.

---

### 13 — Node Shape Rendering
- Implemented all 6 node shapes: rectangle, circle, pill (CSS), diamond, cylinder, hexagon (SVG).
- Used `vector-effect="non-scaling-stroke"` for SVG shapes to prevent stroke width scaling on resize.
- Integrated **NodeResizer** inside each node for collaborative resizing.
- Built custom HTML5 ghost drag preview matching each shape.
- **Learned**: SVG path drawing, non-scaling strokes, React Flow's NodeResizer API, canvas coordinate systems.

---

### 14 — Node Editing
- Added **inline double-click label editing** with an auto-growing `<textarea>`.
- `nodrag nowheel` CSS boundaries block canvas pan/drag while typing.
- Escape cancels, Enter (without Shift) confirms.
- Changes sync to Liveblocks collaborative session via `setNodes`.
- **Learned**: Inline editing UX, auto-growing textarea technique, blocking canvas events during text input.

---

### 15 — Node Color Toolbar
- Built a **floating color toolbar** above selected nodes using React Flow's `<NodeToolbar>`.
- 8 color swatches with active ring indicators, text-colored dots, and hover glows.
- Pointer event interception prevents canvas drag while using the toolbar.
- Applied glowing box-shadows (CSS) and drop-shadow filters (SVG) tied to each node's active color.
- **Learned**: NodeToolbar positioning, pointer event propagation control, dynamic CSS variable-driven glow effects.

---

### 16 — Edge Behavior
- Created `<CanvasEdgeComponent>` with smooth-step paths and closed arrowheads.
- Added a **thick invisible overlay path** to make edges easier to click/hover.
- Implemented **inline double-click edge label editing** with CSS auto-growing input.
- **Learned**: Custom React Flow edges, SVG path rendering, hit-area expansion patterns, edge label UX.

---

### 17 — Canvas Ergonomics
- Added a **floating control bar** with animated zoom (in/out/fit) and collaborative undo/redo buttons.
- Built `hooks/useKeyboardShortcuts.ts` for canvas-wide keyboard shortcuts (+, -, Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z).
- Shortcuts are ignored when an input, textarea, or contentEditable field is active.
- **Learned**: Global keyboard event handling, active element guards, Liveblocks history API.

---

### 18 — Starter Templates
- Designed 3 prebuilt system design templates: **Microservices**, **CI/CD Pipeline**, **Event-Driven System**.
- Built `<StarterTemplatesModal>` and `<TemplatePreview>` with dynamic viewport-scaled node previews.
- Used **CustomEvents** to trigger canvas state imports without prop drilling.
- **Learned**: Template preview rendering with coordinate normalization, CustomEvent-based cross-component communication.

---

### 19 — Presence Avatars & Cursors
- Implemented **collaborative presence avatars** in the navbar: overlapping stack of up to 5 photos/initials + overflow badge.
- Created `<LiveCursors>` with colored SVG arrow cursors and name badges.
- Elevated `RoomProvider` to the page level so both canvas and navbar can access room state.
- Used `ViewportPortal` so cursors translate and scale correctly with canvas zoom/pan.
- **Learned**: Liveblocks `useOthers`, presence broadcasting, React Flow's ViewportPortal, provider scope elevation.

---

### 20 — AI Sidebar Shell
- Extracted `<AiSidebar>` from `EditorShell` into a dedicated component.
- Built tabbed interface (AI Architect + Specs tabs) using shadcn Tabs.
- Implemented AI chat UI: empty state starter chips, styled user/assistant chat bubbles, auto-resizing textarea.
- Applied `inert` attribute to the closed sidebar to block keyboard focus traversal into hidden content.
- **Learned**: Inert attribute for accessibility, tabbed panel architecture, chat bubble layout patterns.

---

### 21 — Canvas Autosave
- Built **canvas persistence** with Vercel Blob (private blobs) and Prisma (stores blob URL).
- Created `useCanvasAutosave` hook with debounce to avoid thrashing.
- On room entry into an empty room: loads historical canvas state from Blob.
- Added a manual **Save button** in the navbar with Saving/Saved/Error states.
- Fixed Vercel Blob 500 error by explicitly passing `token: process.env.BLOB_READ_WRITE_TOKEN`.
- **Learned**: Blob storage vs database storage separation, debounce autosave pattern, private vs public blobs, SDK env var pickup quirks with Turbopack.

---

## Skills Developed

### Frontend Architecture
- Designing scalable React component hierarchies with clear state ownership
- Shell/orchestrator pattern for managing complex multi-zone layouts
- Context + hook pattern for shared UI state across component trees
- Conditional rendering and compound component patterns

### Full-Stack Development with Next.js
- App Router with Server Components and Client Components
- Async Server Components for data fetching (no `useEffect`, no client waterfalls)
- Route handlers as thin orchestrators delegating to shared modules
- Dynamic route params as Promises (Next.js 16 breaking change)
- Middleware for route protection with Clerk

### Authentication & Access Control
- Clerk integration: provider, middleware, server-side `auth()`, `currentUser()`
- Role-based access control: owner vs collaborator patterns
- Enforcing auth at every mutation boundary (401/403 patterns)
- Clerk Backend API for server-side user enrichment

### Database Design with Prisma
- Schema-first relational modeling with cascade deletes and indexes
- Prisma v7 adapter pattern (adapter is now always required)
- Singleton client pattern with hot-reload safety
- Handling Prisma Accelerate extensions conditionally

### Real-Time Collaboration with Liveblocks
- Room-based collaboration model with presence and storage
- Liveblocks auth token issuance from a server route
- Typed presence system (cursor, isThinking)
- Collaborative mutations via `useMutation` and `useOthers`
- Provider hierarchy and scope management

### Canvas Development with React Flow
- Custom node and edge components
- NodeToolbar, NodeResizer, ViewportPortal APIs
- Coordinate system translation (screen space to flow space)
- Drag-and-drop with precise coordinate mapping
- Keyboard shortcuts with input-element guards

### Background Tasks & AI
- Trigger.dev task authoring for durable background AI workflows
- Separating long-running work from request handlers (architectural invariant)

### Blob Storage
- Vercel Blob for large artifact storage (canvas snapshots, Markdown specs)
- Storing blob URLs in the database as references (not the content itself)
- Private blobs with explicit token passing

### UI/UX Design
- Dark-only design token system with CSS custom properties
- Tailwind v4 `@theme inline` token mapping
- Node color palettes for dark canvas backgrounds
- Shape rendering: CSS border-radius for simple shapes, SVG paths for complex shapes
- Glassmorphism overlays with `backdrop-blur`
- Floating toolbars, modals, and slide-over sidebars
- Accessible keyboard navigation with `inert` attribute
- Auto-growing textarea technique

### Debugging & Problem Solving
- Diagnosing Turbopack env var injection differences from Webpack
- SSL mode semantics and database connection string configuration
- HMR singleton cache invalidation patterns
- Coordinate system bugs in drag-and-drop
- React Flow connection handle mode (`ConnectionMode.Loose`) behavior
- Timer leaks and cleanup with `useRef`

---

## Key Architectural Decisions Made

| Decision | Why |
|---|---|
| **Server Components by default** | Avoid unnecessary client bundles, fetch data at the server boundary |
| **Thin route handlers** | Long-running AI work goes in Trigger.dev, not in Next.js API routes |
| **Separate storage layers** | Database = metadata + URLs; Blob = large content. Never store large content in Postgres |
| **Auth at every mutation** | No implicit trust — every PATCH/DELETE verifies ownership before acting |
| **Liveblocks for real-time** | Handles presence, storage, and conflict resolution without a custom WebSocket server |
| **Prisma v7 adapter** | v7 requires explicit adapter; branching on `DATABASE_URL` prefix enables Accelerate transparently |
| **Context + hook for dialogs** | Avoids deep prop drilling while keeping state co-located with its owner |
| **`inert` for closed sidebars** | Prevents keyboard users from tabbing into off-screen hidden content |
| **Explicit Blob token** | Turbopack does not reliably auto-pick `BLOB_READ_WRITE_TOKEN` in SDK contexts |

---

## Current State of the Project

**Phase**: Backend & AI Workflows

**Completed**: 22 feature units (Units 01-21 + several follow-up fixes)

**In Progress**: Unit 22 — Design Agent API (Trigger.dev integration, `TaskRun` database model, trigger endpoints)

**Upcoming**:
- Unit 23 — Design agent logic (AI prompt to canvas nodes/edges)
- Unit 24 — AI presence state (typing indicator while AI generates)
- Unit 25 — Sidebar chat feed (streaming chat messages)
- Unit 26 — Functional AI chat
- Unit 27 — Spec generation flow
- Unit 28 — Spec persistence and download
- Unit 29 — Spec UI integration

---

## Bugs Fixed (Notable)

| Bug | Root Cause | Fix |
|---|---|---|
| Clerk JS failed to load | Turbopack omits `NEXT_PUBLIC_` vars not explicitly referenced | Pass vars explicitly to `<ClerkProvider>` |
| `Failed to save` canvas (500) | Vercel Blob SDK did not auto-pick token under Turbopack | Pass `token: process.env.BLOB_READ_WRITE_TOKEN` explicitly |
| Middleware runtime error | Next.js 16 requires `proxy.ts` not `middleware.ts` | Renamed the file |
| Collaborator access broken | Queried collaborator by `userId` instead of email | Fetch `currentUser()` and query by email |
| HMR Liveblocks client stale | `globalThis` cache never invalidated on key change | Track `liveblocksKey`, recreate client if key changes |
| SSL deprecation warning | `sslmode=require` deprecated in `pg` | Changed to `sslmode=verify-full` |
| Dialog timer leak | `setTimeout` ref not cancelled on close | Track timer with `useRef`, cancel on close |
| Cursor/drag coordinates wrong | Screen space vs flow space mismatch | Use `screenToFlowPosition` + container rect offset |
| Handle connection error | React Flow expected `type="source"` strictly | Set all 4 handles to `type="source"` in `ConnectionMode.Loose` |
| Auto-zoom on first drop | `fitView` triggered on empty-canvas first drop | Disabled with a `useRef`-based first-drop guard |

---

*Last updated: July 2026 - Ghost AI project - Units 01-21 complete, Unit 22 in progress*
