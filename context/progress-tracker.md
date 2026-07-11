# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation Setup

## Current Goal

- Ready for next feature specification.

## Completed

- `[x]` 01-design-system — shadcn/ui initialized, all 7 UI primitive components added, `lib/utils.ts` `cn()` helper in place, dark-only `globals.css` updated with full Ghost AI design token palette.
- `[x]` 02-editor-chrome — `EditorNavbar` (fixed top bar, sidebar toggle with `PanelLeftOpen`/`PanelLeftClose`) and `ProjectSidebar` (floating overlay, slide-in, `Tabs` for My Projects / Shared, empty placeholders, New Project button) created in `components/editor/`. Dialog pattern deferred to future use as specified.
- `[x]` Editor wiring — `EditorShell` manages sidebar state and wires `EditorNavbar` (receives `isSidebarOpen` and `onSidebarToggle` props) with `ProjectSidebar` (receives `isOpen` and `onClose` props).
- `[x]` 03-auth — `ClerkProvider` wraps root layout with dark theme + CSS variable overrides. `proxy.ts` at project root (protected-first: everything blocked except `/sign-in(.*)` and `/sign-up(.*)`). Sign-in and sign-up pages at `app/(auth)/sign-in/[[...sign-in]]/` and `app/(auth)/sign-up/[[...sign-up]]/` — two-panel layout on large screens (branding left, Clerk form right), form-only on mobile, no hardcoded colors. `/` redirects authenticated users to `/editor`, unauthenticated to `/sign-in`. Editor moved to `app/editor/page.tsx`. `UserButton` added to `EditorNavbar` right section. `@clerk/ui` installed. `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` added to `.env.local`.
- `[x]` 04-project-dialogs — Editor home screen (`EditorHome`) added with heading and `New Project` button. `useProjectDialogs` hook in `hooks/use-project-dialogs.ts` manages dialog/form/loading state and mock project data. Three dialogs in `components/editor/project-dialogs.tsx`: Create (live slug preview), Rename (auto-focus, Enter submits, prefilled), Delete (destructive confirm). `ProjectSidebar` updated with per-project rename/delete actions (hover-reveal, owned projects only), mock data list, and mobile backdrop scrim. `ProjectDialogsContext` in `contexts/project-dialogs-context.tsx` lets `EditorHome` call `openCreate` without prop-drilling. All state owned in `EditorShell`. No API calls or persistence.
- `[x]` 05-prisma — `prisma/models/project.prisma` with `Project` and `ProjectCollaborator` models (cascade delete, indexes on `ownerId`, `createdAt`, `email`, `projectId/createdAt`; unique on `projectId/email`). `lib/prisma.ts` cached singleton branches on `DATABASE_URL` prefix: `prisma+postgres://` → `@prisma/adapter-pg` + `withAccelerate()` extension; otherwise direct `@prisma/adapter-pg`. Global cache in dev for hot-reload safety. Migration `20260711095929_init_projects` applied. Prisma Client (v7.8.0) generated to `app/generated/prisma/`. `tsc --noEmit` passes with zero errors.
- `[x]` 06-project-apis — Four REST endpoints under `app/api/projects/`: `GET /api/projects` lists the authenticated user's projects (ordered by `createdAt` desc); `POST /api/projects` creates a project defaulting name to `Untitled Project`; `PATCH /api/projects/[projectId]` renames (owner-only); `DELETE /api/projects/[projectId]` deletes (owner-only, returns 204). Unauthenticated requests return 401; non-owner mutations return 403. Uses Clerk `auth()` from `@clerk/nextjs/server`. `npm run build` passes — both routes appear as dynamic (ƒ) in the route table.
- `[x]` 07-wire-editor-home — `lib/data/projects.ts` server-side helper fetches owned and shared projects. `hooks/use-project-actions.ts` replaces mock hook with real `fetch` calls: create POSTs and navigates to new workspace, rename PATCHes and refreshes, delete DELETEs and redirects to `/editor` if the active project was deleted, otherwise refreshes. `app/editor/page.tsx` converted to async Server Component passing `ownedProjects`/`sharedProjects` to `EditorShell`. `EditorShell` accepts these props plus optional `activeProjectId`. `ProjectSidebar` updated to use `ProjectRow` type. `CreateProjectDialog` accepts `roomIdPreview` prop (computed in hook with unique suffix). `npm run build` passes.

- `[x]` 08-editor-workspace-shell — Implemented workspace shell at `/editor/[roomId]`. Created `lib/project-access.ts` to check ownership and collaborator access based on Clerk `auth()` and `currentUser()?.primaryEmailAddress`. Added `<AccessDenied />` for unauthenticated or unauthorized users. Passed `roomId` from creation payload directly into Prisma so DB ID matches Liveblocks room ID perfectly. Extended `EditorShell` with `activeProjectId` for sidebar highlighting and derived `projectName` for `EditorNavbar`. Added layout placeholders for the Canvas and AI Chat Sidebar in the workspace page. `tsc --noEmit` and `npm run build` pass successfully.

## In Progress

- None.

## Next Up

- 09-share-dialog.md (next feature spec)

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.
- Prisma (05): Schema split into `prisma/schema.prisma` (generator + datasource) and `prisma/models/project.prisma` (models), picked up automatically by `prisma.config.ts` `schema: "prisma/"`. Generator uses `provider = "prisma-client"` (v7) with explicit `output = "../app/generated/prisma"`. `PrismaClient` requires an adapter in v7 — both the direct and Accelerate branches pass `new PrismaPg({ connectionString: url })`. The Accelerate branch additionally chains `.$extends(withAccelerate())`. `@prisma/extension-accelerate` is installed but the Accelerate branch is only active when `DATABASE_URL` starts with `prisma+postgres://`.
- Project APIs (06): Route handlers use Next.js 16 `params: Promise<{ projectId: string }>` (dynamic params are now Promises). Auth uses `const { userId } = await auth()` from `@clerk/nextjs/server` — not `auth.protect()` which returns 404 for unauthenticated API requests instead of 401. Owner enforcement is done by fetching only `{ id, ownerId }` before any mutation, comparing to `userId`, and returning 403 if they differ. DELETE returns `new Response(null, { status: 204 })` with no body.
- Wire editor home (07): `app/editor/page.tsx` is an async Server Component — no `"use client"`. Data is fetched with `getUserProjects()` from `lib/data/projects.ts` using Prisma + Clerk `auth()`. The Prisma return type is inferred with `Awaited<ReturnType<typeof prisma.project.findFirst>>` to avoid importing from generated client paths that differ from the barrel export. `useProjectActions` generates a unique room ID suffix with `Math.random().toString(36).slice(2,7)` concatenated after the slug. The sidebar now receives separate `ownedProjects` and `sharedProjects` arrays instead of a mixed `projects` array filtered internally.

## Session Notes

- Wiring lives in `EditorShell` (client component): owns `sidebarOpen` state and `toggleButtonRef`. `EditorNavbar` receives `isSidebarOpen`, `onSidebarToggle`, and `toggleRef` (forwarded to the toggle `<Button>`). `ProjectSidebar` receives `isOpen` and `onClose`; closing calls `toggleButtonRef.current?.focus()` to return keyboard focus to the navbar toggle. `inert` on the closed sidebar prevents keyboard traversal into off-screen content.
- Auth (03): `ClerkProvider` lives above `<html>` in `app/layout.tsx`. Route protection uses protected-first `clerkMiddleware` in `proxy.ts` (Next.js 16 filename convention). Auth pages live in a `(auth)` route group to isolate them from the editor layout. Editor route is now at `/editor` (previously `/`).
- Project Dialogs (04): Dialog state lives exclusively in `EditorShell` via `useProjectDialogs`. `ProjectDialogsContext` is provided by `EditorShell` so child components (`EditorHome`) can open dialogs without props. `EditorPage` remains a Server Component (no `"use client"`) to preserve `export const metadata`. `MockProject.isOwned` controls whether rename/delete actions are shown in the sidebar item row.
- Issues (current-issues.md): Two bugs fixed. (1) `project-sidebar.tsx` — added `group-focus-within:opacity-100` alongside `group-hover:opacity-100` on the action container `div` so keyboard focus on either Rename or Delete reveals the buttons. (2) `hooks/use-project-dialogs.ts` — `pendingTimerRef` (useRef) now tracks every `setTimeout` handle; `closeDialog` cancels and nullifies it before resetting state; each submit callback nullifies the ref at the start of its body so an already-dismissed dialog cannot apply stale state updates.
- pg SSL deprecation warning (07 follow-up): After wiring real DB calls in `EditorPage`, a Node.js `Warning` surfaced in the Next.js overlay on every `/editor` load: `SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'`. Root cause — `DATABASE_URL` contained `?sslmode=require`; the `pg-connection-string` library (used internally by `@prisma/adapter-pg` → `pg`) warns that `require`/`prefer`/`verify-ca` will change semantics in `pg v9.0.0`. Fix: changed `sslmode=require` → `sslmode=verify-full` in both `.env` and `.env.local`. Security level is identical; the new value is the explicit canonical name for the current behaviour, which silences the warning.
