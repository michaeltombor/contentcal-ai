# ContentCal.AI Complete File List
# run with node list-all-files.js
## All Project Files
```
.DS_Store
.env
.firebaserc
.gitignore
.npmrc
.prettierignore
.prettierrc
PROJECT_STATUS.md
README.md
all-files.txt
chat-context/COMBINED_CONTEXT.md
chat-context/FILES_LIST.md
chat-context/PROJECT_STATUS.md
eslint.config.js
firebase-debug.log
firebase.json
firestore-debug.log
firestore.rules
functions/src/index.ts
list-all-files.js
package.json
pnpm-lock.yaml
prepare-ai-context.sh
project-status.ts
src/.DS_Store
src/app.css
src/app.d.ts
src/app.html
src/demo.spec.ts
src/lib/.DS_Store
src/lib/components/Button.svelte
src/lib/components/Modal.svelte
src/lib/components/Toast.svelte
src/lib/components/ai/ContentSuggestionPanel.svelte
src/lib/components/calendar/CalendarCell.svelte
src/lib/components/calendar/DraggablePost.svelte
src/lib/components/common/Button.svelte
src/lib/components/common/Modal.svelte
src/lib/components/common/Toast.svelte
src/lib/components/common/ToastContainer.svelte
src/lib/components/layout/Footer.svelte
src/lib/components/layout/Header.svelte
src/lib/components/ui/LoadingSpinner.svelte
src/lib/components/ui/Toast.svelte
src/lib/firebase/config.ts
src/lib/firebase/firebase.ts
src/lib/index.ts
src/lib/services/aiService.ts
src/lib/services/authService.ts
src/lib/services/contentService.ts
src/lib/services/firebaseConfig.ts
src/lib/services/postService.ts
src/lib/services/recommendationService.ts
src/lib/services/storageService.ts
src/lib/services/toastService.ts
src/lib/services/twitterService.ts
src/lib/stores/authStore.ts
src/lib/stores/calendarStore.ts
src/lib/stores/postStore.ts
src/lib/stores/toastStore.ts
src/lib/types/AIContent.ts
src/lib/types/Post.ts
src/lib/types/calendar.ts
src/lib/types/content.ts
src/lib/types/user.ts
src/lib/types.ts
src/routes/+error.svelte
src/routes/+layout.svelte
src/routes/+page.server.ts
src/routes/+page.svelte
src/routes/.DS_Store
src/routes/auth/+page.svelte
src/routes/auth/login/+page.svelte
src/routes/auth/register/+page.svelte
src/routes/auth/reset-password/+page.svelte
src/routes/calendar/+page.svelte
src/routes/calendar/components/Calendar.svelte
src/routes/calendar/components/CalendarDay.svelte
src/routes/calendar/components/CalendarHeader.svelte
src/routes/calendar/components/CalendarLoading.svelte
src/routes/calendar/components/CalendarMonth.svelte
src/routes/calendar/components/CalendarSidebar.svelte
src/routes/calendar/components/CalendarWeek.svelte
src/routes/calendar/components/PostCreateModal.svelte
src/routes/calendar/components/PostEditor.svelte
src/routes/dashboard/+layout.svelte
src/routes/dashboard/+page.svelte
src/routes/dashboard/analytics/+page.svelte
src/routes/dashboard/calendar/+page.svelte
src/routes/dashboard/create/+page.svelte
src/routes/dashboard/recommendations/+page.svelte
src/routes/landing/+page.svelte
src/routes/login/+page.svelte
src/routes/page.svelte.test.ts
src/routes/register/+page.svelte
static/.DS_Store
static/favicon.png
static/images/logo.png
static/images/logo.svg
storage.rules
svelte.config.js
tsconfig.json
vite.config.ts
vitest-setup-client.ts
```

## Component Relationships

### Calendar Component and Related UI Components

```
CalendarCell.svelte
  ├── Imports:
  │   └── DraggablePost (from ./DraggablePost.svelte)
  └── Used by:
      └── DraggablePost

DraggablePost.svelte

+page.svelte
  ├── Imports:
  │   └── Button (from $lib/components/common/Button.svelte)
  │   └── Modal (from $lib/components/common/Modal.svelte)
  │   └── Calendar (from ./components/Calendar.svelte)
  │   └── PostCreateModal (from ./components/PostCreateModal.svelte)
  │   └── ToastContainer (from $lib/components/common/ToastContainer.svelte)
  │   └── Button (from $lib/components/common/Button.svelte)
  │   └── Button (from $lib/components/Button.svelte)
  └── Used by:
      └── Button
      └── Modal
      └── AuthStore
      └── Calendar
      └── PostCreateModal
      └── ToastContainer
      └── Line

Calendar.svelte
  ├── Imports:
  │   └── CalendarDay (from ./CalendarDay.svelte)
  │   └── CalendarWeek (from ./CalendarWeek.svelte)
  │   └── CalendarMonth (from ./CalendarMonth.svelte)
  │   └── CalendarHeader (from ./CalendarHeader.svelte)
  │   └── CalendarSidebar (from ./CalendarSidebar.svelte)
  │   └── PostEditor (from ./PostEditor.svelte)
  │   └── CalendarLoading (from ./CalendarLoading.svelte)
  │   └── ToastContainer (from $lib/components/common/ToastContainer.svelte)
  └── Used by:
      └── ToastContainer
      └── CalendarDay
      └── CalendarWeek
      └── CalendarMonth
      └── CalendarHeader
      └── CalendarSidebar
      └── PostEditor
      └── CalendarLoading

CalendarDay.svelte
  ├── Imports:
  │   └── CalendarDay (from ./CalendarDay.svelte)
  │   └── CalendarWeek (from ./CalendarWeek.svelte)
  │   └── CalendarMonth (from ./CalendarMonth.svelte)
  │   └── CalendarHeader (from ./CalendarHeader.svelte)
  │   └── CalendarSidebar (from ./CalendarSidebar.svelte)
  │   └── PostEditor (from ./PostEditor.svelte)
  │   └── CalendarLoading (from ./CalendarLoading.svelte)
  │   └── ToastContainer (from $lib/components/common/ToastContainer.svelte)
  └── Used by:
      └── ToastContainer
      └── CalendarDay
      └── CalendarWeek
      └── CalendarMonth
      └── CalendarHeader
      └── CalendarSidebar
      └── PostEditor
      └── CalendarLoading

CalendarHeader.svelte

CalendarLoading.svelte

CalendarMonth.svelte

CalendarSidebar.svelte

CalendarWeek.svelte

PostCreateModal.svelte
  ├── Imports:
  │   └── Button (from $lib/components/Button.svelte)
  │   └── Modal (from $lib/components/Modal.svelte)
  └── Used by:
      └── Button
      └── Modal

PostEditor.svelte

+page.svelte
  ├── Imports:
  │   └── Button (from $lib/components/common/Button.svelte)
  │   └── Modal (from $lib/components/common/Modal.svelte)
  │   └── Calendar (from ./components/Calendar.svelte)
  │   └── PostCreateModal (from ./components/PostCreateModal.svelte)
  │   └── ToastContainer (from $lib/components/common/ToastContainer.svelte)
  │   └── Button (from $lib/components/common/Button.svelte)
  │   └── Button (from $lib/components/Button.svelte)
  └── Used by:
      └── Button
      └── Modal
      └── AuthStore
      └── Calendar
      └── PostCreateModal
      └── ToastContainer
      └── Line

### PostCreateModal.svelte Relationships

This modal is used for creating and editing posts in the calendar view. It:
- Is opened from the Calendar.svelte component or related calendar views
- Contains form fields for post content, platform selection, and scheduling
- Uses platform-specific components for previews
- May use rich text editors or markdown components for post content
- Communicates with the post service to save/update post data
- Calls Firebase functions for AI suggestions when needed

```
PostCreateModal.svelte imports:
  └── Button (from $lib/components/Button.svelte)
  └── Modal (from $lib/components/Modal.svelte)

PostCreateModal.svelte is used by:
  └── Button
  └── Modal
```

### Page Components and Flow

SvelteKit uses a file-based routing system where:
- `+page.svelte` defines the page content
- `+layout.svelte` defines the layout wrapper
- `+page.server.js` handles server-side logic
- `+layout.server.js` handles layout server logic

Calendar flow:
1. User navigates to /calendar route
2. Calendar layout loads with navigation
3. Calendar view shows scheduled posts
4. Clicking "Create Post" opens PostCreateModal
5. Submitting form saves post to Firebase
6. Calendar refreshes with the new post


## Git Information
```
On branch main
Your branch is ahead of 'origin/main' by 1 commit.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	deleted:    docs/AI_ASSISTANT_GUIDE.md
	modified:   list-all-files.js
	modified:   prepare-ai-context.sh

no changes added to commit (use "git add" and/or "git commit -a")

```
