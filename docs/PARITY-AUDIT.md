# Mobile web parity audit

Date: 22 November 2026. App baseline cc9ff54. Work branch: fix/mobile-web-parity-audit.

This is an active code audit, not a claim of pixel parity. Current website source was checked through the main branch of MedQs0 for navigation, dashboard, module catalog, quiz catalog, notifications and missing student pages. Older cached source for the remaining screens is a lead, not final current-state evidence. Phone screenshots of the native build are still needed to validate native stacking and text metrics.

## Priority 0
- Bottom fade overlays capsule: capsule wrapper lacked its own stacking order. Batch 1 adds explicit z-index/elevation above the fade. Native Android result awaits device confirmation.
- Guest browsing still reaches backend through module details, rooms, tiers and manual refresh. Batch 1 makes these local and adds a last-resort API guard.

## Page register
| Page | Confirmed gap / next check | Priority |
|---|---|---|
| Home | Suggested list hard-coded empty; lecture cover hard-coded null; rank bar omitted; daily target based on task count rather than 50. Header actions open full pages instead of sheets. | P1 |
| Notifications | Placeholder rather than notification sheet, filters and list. | P1 |
| More / global navigation | Full two-column tab page instead of expanding three-column capsule. Wrong route list and missing destinations. Route-based label/icon and hide-on-sheet behavior absent. | P1 |
| Modules | Search route missing; details wait for failed fetch before fixture display. Empty/loading/error states need comparison. | P1 |
| Module detail | Guest data source correction in batch 1. Cards, tabs, empty subjects and assessments need current-source pixel comparison. | P1 |
| Subject | Guest data source correction in batch 1. Filters, accordion and empty states need current-source comparison. | P1 |
| Lecture | Many visible actions have no handlers; video, notes, attachments and tabs require interaction review against current source. | P1 |
| QBank | Search/filter exists. Full card and empty/loading/error state comparison pending. | P2 |
| Quiz / Results | Local quiz flow exists. Review timer, report sheet, question map, missed-only retake and back behavior. | P2 |
| Social | Create-post FAB is a no-op; forum selection does not filter feed; comments/profile navigation incomplete. | P1 |
| Profile | Local follow/tab state exists. Edit, saved posts, empty states and Arabic need comparison. | P2 |
| Settings | Theme selection is not connected to provider. Language/RTL persistence and controls need wiring; demo must not store AI credentials. | P1 |
| AI Chat | Static conversation, sidebar button navigates back, composer actions incomplete. Local mock interaction needed, no AI/backend calls. | P1 |
| Taskat | Local task/checklist flow exists; date selection, persistence, sheets and keyboard/RTL need comparison. | P2 |
| Teams list/detail | Local list/detail/follow/member changes exist. Access state, tab actions and empty states need review. | P2 |
| Atlas | Local system/search/structure sheets exist. Bookmarks/notes state and RTL require review. | P2 |
| DrawMed | Toolbar choices update local state, drawing surface is not implemented. | P1 |
| Podcasts | Search exists, playback actions incomplete. | P1 |
| Downloads | Display exists, actual download actions incomplete. | P1 |
| About / Founders | Static structure exists. Current content, links, spacing and RTL need comparison. | P2 |
| Login | Guest button exists. OAuth flow is not end-to-end verified and backend exchange is outside this audit. | P2 |
| Search | Missing route, linked from modules. | P1 |
| Videos / Reels | Missing routes despite More links. Current website videos page confirmed. | P1 |
| Study Tools | Current website page confirmed, missing app route. | P1 |
| Leaderboard | Current website page confirmed, missing app route. | P1 |
| Transcriptions | Current website page confirmed, missing app route. Upload/transcription must remain local demo. | P1 |
| Saved / Rooms | Existing app links target absent routes; need coherent local screens or expected sheets. | P1 |

## Batch 1
- Explicit nav wrapper z-index 20 / Android elevation 20, fade stays 5.
- Capsule tint follows current website dark background / light white surface.
- Guest API guard, fixture-safe manual refresh and immediate module-detail fixtures.
- Suggested lecture sample data, responsive 72% card widths, rank bar, daily target, carousel stride correction.
- TypeScript passed. Browser phone preview at 390x844: Home, Social, Modules and Module detail, zero observed backend API calls and zero runtime exceptions. Browser proof does not replace an Android device check.
