## Issues

All previously reported issues (Issues 2-7) have been resolved.

### [Resolved] 2. Delete Nodes and Edges
Selected nodes and edges can now be deleted using Backspace/Delete keys from the canvas wrapper. Default React Flow deletion behavior is disabled to prevent duplicate handling or conflicts with input fields. All deletions are fully collaborative.

### [Resolved] 3. Node Connection Handles
All four connection handles (top, bottom, left, right) are active and connectable. Both source and target handles have been implemented at each position on the custom node, resolving React Flow's ID mapping constraints collaboratively.

### [Resolved] 4. Drag and Drop Position Offset
Coordinates on drag drop are manually projected accounting for the canvas wrapper container's bounding rect and the current zoom/pan state, placing the dropped node exactly centered under the user's cursor.

### [Resolved] 5. Auto Zoom on First Node Drop
Automatic zooming/fitting when dropping the first node onto a completely empty canvas has been disabled via a ref-based check, keeping the viewport position exactly where the user left it.

### [Resolved] 6. Collaborator Avatar Image Error
Added `img.clerk.com` to `images.remotePatterns` inside `next.config.ts`, allowing collaborator avatar images to resolve successfully.

### [Resolved] 7. Remove UserButton from Workspace Navbar
Conditionally hid the Clerk `UserButton` on the workspace navbar (when `projectName` is defined) while keeping it active on the Editor Home page navbar.