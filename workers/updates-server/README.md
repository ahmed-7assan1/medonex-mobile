# updates-server

Self-hosted expo-updates server for MedOneX mobile, on Cloudflare's free tier.

- Protocol: expo-updates v1 (see github.com/expo/custom-expo-updates-server for Expo's reference demo).
- Publish an update: `npm run export:update` in the app root, then the publish
  script uploads `dist/` to R2 and bumps `releases/latest.json` (script TODO).
- Secrets (signing private key) live only as Cloudflare Worker secrets —
  this is a PUBLIC repo, never commit keys.
