

The file already has `staleTime: 0` from the previous turn (verified in current file view at top of conversation). No change needed.

## Plan

Verify `src/hooks/useAppOptions.ts` line 21 currently reads `staleTime: 0`. If so, no edit is required — report back to user that the fix is already in place and suggest a hard refresh to clear the browser's existing cache. If it somehow reverted to `1000 * 60 * 10`, apply the one-line change.

