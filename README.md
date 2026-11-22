# MedOneX Mobile

The MedOneX student app — Android first, iOS later. React Native (Expo SDK 54),
one codebase, phone UI matched to the MedOneX website's mobile design, with a
desktop-like layout on tablets.

- Updates ship over the air from our own free Cloudflare server
  (`workers/updates-server`), Telegram-style: no store download for JS changes.
- Languages: English base, Arabic switch with full RTL.
- Data: the live MedOneX backend (`/api/mobile`, `/api/v1`) — no new backend work.

## PUBLIC REPOSITORY — hard rules

1. Never commit secrets: no API keys, no `.env`, no keystores, no signing keys.
   CI runs gitleaks on every push; a leaked key must be rotated immediately.
2. Production of the MedOneX website (repo MedQs0, branch main) is never
   touched from this repo.
3. Backend, database, or env changes require the owner's explicit approval.

## Phases

- Phase 0 (this commit): project skeleton, design tokens from the site,
  i18n + RTL, OTA config, secret-scan CI.
- Phase 1: sign-in (Google via Supabase) + Home, pixel-matched to the site.
- See the audit and v1 plan (private) for screens, milestones, decisions.
