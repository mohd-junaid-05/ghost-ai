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

## In Progress

- None.

## Next Up

- 05 (next feature spec)

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Wiring lives in `EditorShell` (client component): owns `sidebarOpen` state and `toggleButtonRef`. `EditorNavbar` receives `isSidebarOpen`, `onSidebarToggle`, and `toggleRef` (forwarded to the toggle `<Button>`). `ProjectSidebar` receives `isOpen` and `onClose`; closing calls `toggleButtonRef.current?.focus()` to return keyboard focus to the navbar toggle. `inert` on the closed sidebar prevents keyboard traversal into off-screen content.
- Auth (03): `ClerkProvider` lives above `<html>` in `app/layout.tsx`. Route protection uses protected-first `clerkMiddleware` in `proxy.ts` (Next.js 16 filename convention). Auth pages live in a `(auth)` route group to isolate them from the editor layout. Editor route is now at `/editor` (previously `/`).
- Project Dialogs (04): Dialog state lives exclusively in `EditorShell` via `useProjectDialogs`. `ProjectDialogsContext` is provided by `EditorShell` so child components (`EditorHome`) can open dialogs without props. `EditorPage` remains a Server Component (no `"use client"`) to preserve `export const metadata`. `MockProject.isOwned` controls whether rename/delete actions are shown in the sidebar item row.
- Issues (current-issues.md): Two bugs fixed. (1) `project-sidebar.tsx` — added `group-focus-within:opacity-100` alongside `group-hover:opacity-100` on the action container `div` so keyboard focus on either Rename or Delete reveals the buttons. (2) `hooks/use-project-dialogs.ts` — `pendingTimerRef` (useRef) now tracks every `setTimeout` handle; `closeDialog` cancels and nullifies it before resetting state; each submit callback nullifies the ref at the start of its body so an already-dismissed dialog cannot apply stale state updates.
