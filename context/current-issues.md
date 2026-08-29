# Current Issues

(No open issues — all resolved, see below)

## Resolved

### Generate Spec Button 500 Errors (POST /api/ai/spec and /api/ai/spec/token)

**Errors**:
- `Request failed with status 500` at `handleGenerateSpec` line 292 (POST /api/ai/spec)
- `Token request failed with status 500` at `handleGenerateSpec` line 306 (POST /api/ai/spec/token)

**Root Cause**: The `/api/ai/spec` endpoint only returned `runId`, requiring a second round-trip to `/api/ai/spec/token` to mint a Trigger.dev public access token. This two-step approach was error-prone and inconsistent with the proven `/api/ai/design` pattern. If either call failed (e.g., Prisma hot-reload stale client, Trigger.dev auth, or network issue), the frontend caught a generic 500 with no diagnostic information.

**Fix**:
1. **`app/api/ai/spec/route.ts`**: Refactored to mint the `publicToken` inside the same `POST` handler — matching the `/api/ai/design` route pattern. Both `tasks.trigger` and `triggerSdkAuth.createPublicToken` run in a single request, returning `{ runId, publicToken }` in one response.
2. **`components/editor/ai-sidebar.tsx`**: Updated `handleGenerateSpec` to extract both `runId` and `publicToken` from the single API response. Removed the now-unnecessary second fetch to `/api/ai/spec/token`. Added richer error reporting with the actual response body text (not just the status code).
3. **`lib/prisma.ts`**: Added self-healing check to detect stale cached Prisma client instances missing the `projectSpec` model (from the previous fix). This prevents `TypeError: Cannot read properties of undefined (reading 'findMany')` during hot-module reloads.
