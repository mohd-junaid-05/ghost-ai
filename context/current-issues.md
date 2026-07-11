Fix the following issues. The issues can be from different files or can overlap on same lines in one file.

- Verify each finding against current code. Fix only still-valid issues, skip the rest with a brief reason, keep changes minimal, and validate.

In @components/editor/project-sidebar.tsx around lines 163 - 186, Add keyboard visibility styling to the action container in the project sidebar: retain hover visibility while also revealing it when either Rename or Delete receives focus, using a group-focus-within/focus-visible counterpart to the existing opacity classes. Update the relevant Button or parent class names around the Rename/Delete controls without changing their behavior.

- Verify each finding against current code. Fix only still-valid issues, skip the rest with a brief reason, keep changes minimal, and validate.

In @hooks/use-project-dialogs.ts around lines 64 - 110, Track each pending 400ms timeout in the dialog hook, and update closeDialog to clear and nullify that timer before resetting dialog state, inputs, and isLoading. Store the timer when created by submitCreate, submitRename, or submitDelete, and ensure callbacks clear the stored reference before applying updates so a dismissed dialog cannot trigger stale state changes.