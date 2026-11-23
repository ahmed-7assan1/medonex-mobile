# Admin native implementation inventory

Checked 22 November 2026 against the current local MedQs0 source. This is a missing-work register, not a completion claim. No app admin route or admin screen exists yet. Student work is still in progress.

## Route count

- 31 routable page files under `/admin`, including two redirect entries.
- One additional route in the admin group: `/studio/sync`.
- Two `_experimental` page files are private-folder code, not routable Next.js pages. Do not count them as working routes.

## Missing native routes

| Web route | Source page | Native status |
|---|---|---|
| `/admin/admin-monitoring` | `admin/admin-monitoring/page.tsx` | Not built |
| `/admin/ads` | `admin/ads/page.tsx` | Not built |
| `/admin/ai-keys` | `admin/ai-keys/page.tsx` | Not built |
| `/admin/ai-studio` | `admin/ai-studio/page.tsx` | Not built |
| `/admin/atlas` | `admin/atlas/page.tsx` | Not built |
| `/admin/audit-logs` | `admin/audit-logs/page.tsx` | Not built |
| `/admin/channels` | `admin/channels/page.tsx` | Not built |
| `/admin/content` | `admin/content/page.tsx` | Not built |
| `/admin/content-browser` | `admin/content-browser/page.tsx` | Not built |
| `/admin/dashboard` | `admin/dashboard/page.tsx` | Not built |
| `/admin/forum` | `admin/forum/page.tsx` | Not built |
| `/admin/founders` | `admin/founders/page.tsx` | Not built |
| `/admin/leaderboard` | `admin/leaderboard/page.tsx` | Not built |
| `/admin/og-card` | `admin/og-card/page.tsx` | Not built |
| `/admin` | `admin/page.tsx` | Redirect not built. Source sends to /admin/dashboard. |
| `/admin/pdf-tools` | `admin/pdf-tools/page.tsx` | Not built |
| `/admin/questions` | `admin/questions/page.tsx` | Not built |
| `/admin/questions/reports` | `admin/questions/reports/page.tsx` | Not built |
| `/admin/quiz-analytics` | `admin/quiz-analytics/page.tsx` | Not built |
| `/admin/quiz-creator` | `admin/quiz-creator/page.tsx` | Redirect not built. Source sends to /admin/questions?tab=creator. |
| `/admin/quiz-manager` | `admin/quiz-manager/page.tsx` | Not built |
| `/admin/security` | `admin/security/page.tsx` | Not built |
| `/admin/settings` | `admin/settings/page.tsx` | Not built |
| `/admin/social-reports` | `admin/social-reports/page.tsx` | Not built |
| `/admin/teams` | `admin/teams/page.tsx` | Not built |
| `/admin/telegram` | `admin/telegram/page.tsx` | Not built |
| `/admin/testimonials` | `admin/testimonials/page.tsx` | Not built |
| `/admin/users/[id]` | `admin/users/[id]/page.tsx` | Not built |
| `/admin/users` | `admin/users/page.tsx` | Not built |
| `/admin/video-analytics` | `admin/video-analytics/page.tsx` | Not built |
| `/admin/warnings` | `admin/warnings/page.tsx` | Not built |
| `/studio/sync` | `studio/sync/page.tsx` | Not built |

## Non-route experimental files

- `admin/_experimental/v2-dashboard/page.tsx`, private, not built natively.
- `admin/_experimental/v2-lab/page.tsx`, private, not built natively.

## Shared dependencies to audit before implementation

- Admin group layout checks authentication and allowed roles before rendering. Never use client-only role hiding as access control.
- Shared admin source chrome includes AdminMobileNav, AdminMobilePills, AdminSidebarNav, AdminSwipeLayout, AdminBottomFade and the admin-mode DesktopTopBar.
- Source shell has separate below-768 and 768-plus layouts. Both need exact-source renders and native-device validation.
- Each page may contain tabs, sheets and nested tools. This route count is not a count of those individual interfaces. Inventory their actual controls before calling that route complete.
- AI keys, secrets, settings, account actions, content edits, moderation, imports and destructive actions cannot send writes in the current read-only implementation. Keep these controls visibly guarded.
- No backend, production-data, schema, environment, deployment or push permission is implied by this inventory.

## Student tablet/mobile work

Existing student phone and tablet implementations already exist. Do not classify all of them as missing. The current source-by-source parity audit remains unfinished; docs/PARITY-AUDIT.md has older entries and is not a completion register. Known remaining issues include source dashboard community cards, Saved full-detail and remaining share/player behavior. Saved Markdown, source report/block dialogs and source Study carousel are now implemented with read-only guards; actual device validation remains, standalone video/studio sticky behavior, annotation tablet toolbar, actual Android/iOS verification and production Google/read-only-data end-to-end verification.
