/**
 * MedOneX OTA update server (skeleton) — Cloudflare Worker implementing the
 * expo-updates v1 protocol (spec: github.com/expo/expo "expo-updates-1").
 *
 * Flow: app boots -> GET /manifest -> Worker answers with a signed manifest
 * pointing at the JS bundle + assets stored in the R2 bucket
 * MEDONEX_APP_UPDATES -> app downloads only what changed.
 *
 * Free-tier budget check (22 Nov 2026): 3,000 MAU x ~10 opens/day = ~30k
 * requests/day, under the free 100k/day Worker limit; bundles in R2 free
 * tier (10 GB, 10M Class B reads/mo, free egress).
 *
 * TODO before first production update:
 * - Code signing: private key stays OUT of this public repo (Cloudflare
 *   secret), public certificate ships inside the app build.
 * - Channels: production / staging via the `channel` request header.
 * - Rollback: point the manifest at a previous release id in R2.
 */

export interface Env {
  MEDONEX_APP_UPDATES: R2Bucket;
  UPDATES_PRIVATE_KEY: string; // Cloudflare secret, never committed
}

const LATEST_KEY = 'releases/latest.json';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/manifest') {
      const obj = await env.MEDONEX_APP_UPDATES.get(LATEST_KEY);
      if (!obj) return new Response('no update published', { status: 404 });
      // TODO: sign manifest with UPDATES_PRIVATE_KEY per expo-updates-1 spec.
      return new Response(obj.body, {
        headers: {
          'content-type': 'application/json',
          'expo-protocol-version': '1',
          'expo-sfv-version': '0',
          'cache-control': 'no-store',
        },
      });
    }

    if (url.pathname.startsWith('/assets/')) {
      const obj = await env.MEDONEX_APP_UPDATES.get(url.pathname.slice(1));
      if (!obj) return new Response('not found', { status: 404 });
      return new Response(obj.body, { headers: { 'cache-control': 'public, max-age=31536000, immutable' } });
    }

    return new Response('medonex-mobile updates server', { status: 200 });
  },
};
