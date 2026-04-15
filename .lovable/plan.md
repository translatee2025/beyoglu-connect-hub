

# Group Feed & Group Posts

## Overview
Three changes: filter group posts out of the main wall, create a group detail page with Feed and Members tabs, and add a route for `/groups/:id`.

## Step 1 — Filter main wall feed

**File: `src/pages/Wall.tsx`** (line 43)

Add `.is("group_id", null)` to the wall_posts query so group posts don't appear in the public feed.

## Step 2 — Create GroupDetail page

**New file: `src/pages/GroupDetail.tsx`**

A page at `/groups/:id` with two tabs (Feed, Members) using the existing Tabs component.

**Feed tab:**
- Query `wall_posts` where `group_id = id` and `(status = 'active' OR status IS NULL)`, ordered by `created_at DESC`
- Render posts with the same card layout as Wall.tsx: UserName, timeAgo, content, MediaGrid, LikeButton, CommentsSection
- "Post to Group" button (visible only to members) opens a Dialog with Textarea + MediaUpload. On submit: INSERT into `wall_posts` with `group_id`, `user_id`, `content`, `photos`, `status: 'active'`
- Empty state: "Be the first to post in this group"

**Members tab:**
- Query `group_members` where `group_id = id`, then fetch `profiles` for each `user_id`
- Show avatar, display_name (linked to `/profile/:userId`), role badge (admin/owner/member)
- Message button per member (skip for self) — opens/creates a DM conversation, same pattern as LostFound contact button

**Header area:**
- Shows group name, description, category badge, member count
- Join/Leave button based on membership status

## Step 3 — Add route

**File: `src/App.tsx`**

Add import for GroupDetail and route: `<Route path="/groups/:id" element={<GroupDetail />} />`

## Step 4 — Make group cards clickable

**File: `src/pages/Groups.tsx`**

Wrap the group card title or the card itself with a link/onClick to navigate to `/groups/${group.id}` so users can reach the detail page.

## Files changed
| File | Change |
|------|--------|
| `src/pages/Wall.tsx` | Add `.is("group_id", null)` to wall_posts query |
| `src/pages/GroupDetail.tsx` | New page with Feed + Members tabs |
| `src/App.tsx` | Add route `/groups/:id` |
| `src/pages/Groups.tsx` | Make group cards navigate to detail page |

No database migrations needed — `group_id` and `status` columns already exist on `wall_posts`.

