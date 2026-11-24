# Signal — creator content studio

A browser-only portfolio project for creators and founders building an audience. Plan the kinds of posts you want to share, write your own content, organize your knowledge, and review the week.

## Deploy on Vercel

1. Open [Vercel's new project page](https://vercel.com/new).
2. Import `divyajawalkar22/signal-studio`.
3. Choose **Vite** as the framework, leave the root directory at the repository root, and use **Node.js 24.x**.
4. Keep the build command **npm run build** and output directory **dist**. No environment variables are required.
5. Click **Deploy**.

`vercel.json` includes the framework, build output and basic response headers. Navigation uses URL hashes, so no route rewrites are needed. This project makes no model API calls and needs no backend or database account.

## Run locally

Use Node.js 24.x and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Use localhost or HTTPS, which are required for Web Locks and secure browser APIs.

```sh
npm test
npm run build
npm run preview
```

## What is included

- Editable brand brief and profile workspace, with known-direction and discovery paths.
- Separate weekly plans, slots and written posts. A plan preview contains categories, tags, formats and times, never generated captions.
- One saved plan per week. Reopening edits that plan; saving it does not append duplicates.
- Editable category distribution, posting days and time windows.
- Manual post writing, unscheduled drafts, spontaneous posts and existing-draft attachment to empty slots.
- Draft, review, approved and published records. Editing approved wording requires a new approval.
- Manual carousel slide editing and client-side PDF export.
- Structured knowledge bank with experiences, ideas, references, writing samples, categories, custom topic tags and attribution.
- Create, view, edit and delete controls for brand information, plans, slots, posts, bank entries, labels and weekly reflections.
- Manual result entry with a distinction between zero and unrecorded metrics.
- Backup export/import, legacy Signal JSON migration, and a pre-import recovery copy.
- Cross-tab storage events and Web Locks. Stale editors reject changes instead of overwriting newer records.
- Responsive layouts, labeled fields and native keyboard-accessible dialogs.

## Data relationships

| Action | Result |
| --- | --- |
| Delete a slot or a plan | Attached written posts become unscheduled; their words are retained. |
| Delete a post | Its slot remains empty; saved knowledge-bank items are retained. |
| Delete a bank item | Linked posts keep their content and lose the source link. |
| Save a post to the bank again | Its linked bank item updates rather than duplicating. |
| Edit bank material | Written posts remain unchanged. |
| Rename a category or tag | References update across posts, material and plan slots. |
| Remove a category or tag | The label is removed; content is preserved. |
| Edit an approved caption or slides | Status returns to draft until reviewed again. |
| Edit a published record | Only the local record changes. LinkedIn is unaffected. |

## Storage and scope

All content stays in `localStorage` on the visitor's current browser and origin. It is not uploaded to a server. There are no accounts, cross-device synchronization, AI writing, LinkedIn authentication, automatic publishing or automatic analytics. Visitors publish on LinkedIn themselves and record the URL and publication date in Signal.

Export a backup before clearing browser data, switching browser profiles or moving to a different URL. A Vercel preview URL and a production URL have separate storage. This is a portfolio demo, not a secure shared-device vault. Clearing all browser storage also removes the recovery copy.

The old ChatGPT-hosted workspace is separate. To transfer its content, export its workspace JSON and import that file in **Settings & backups**. No personal data is included in this repository.

## Structure

```text
src/model.ts          Schema, planning, relationships and legacy migration
src/storage.ts        Validated storage transactions and conflict checks
src/App.tsx           Navigation, overview, post list, review and backups
src/Planning.tsx      Weekly plan preview/editor and calendar
src/Editor.tsx        Manual content, approvals, publication records and metrics
src/Knowledge.tsx     Knowledge bank and category/tag management
src/Brand.tsx         Editable brand brief and profile workspace
src/export.ts         Caption and PDF export
tests/                Workflow and storage regression checks
```

Built with React, TypeScript, Vite, Zod and Lucide icons. Runtime dependency versions are pinned in `package-lock.json`.

## Validation

Automated checks exercise plan uniqueness, slot/post deletion behavior, occupied-slot protection, preservation during plan revisions, approval resets, incomplete-carousel validation, source relationships, label changes, publication validation, legacy migration, timezone boundaries, storage failures, concurrent saves and stale-editor protection.

Production build and TypeScript checks were run locally. Interactive browser testing and downloaded PDF rendering still need a manual check after deployment.
