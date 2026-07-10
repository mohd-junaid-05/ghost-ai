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

## In Progress

- None.

## Next Up

- 04 (next feature spec)

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Wiring lives in `EditorShell` (client component): owns `sidebarOpen` state and `toggleButtonRef`. `EditorNavbar` receives `isSidebarOpen`, `onSidebarToggle`, and `toggleRef` (forwarded to the toggle `<Button>`). `ProjectSidebar` receives `isOpen` and `onClose`; closing calls `toggleButtonRef.current?.focus()` to return keyboard focus to the navbar toggle. `inert` on the closed sidebar prevents keyboard traversal into off-screen content.
- Auth (03): `ClerkProvider` lives above `<html>` in `app/layout.tsx`. Route protection uses protected-first `clerkMiddleware` in `proxy.ts` (Next.js 16 filename convention). Auth pages live in a `(auth)` route group to isolate them from the editor layout. Editor route is now at `/editor` (previously `/`).
