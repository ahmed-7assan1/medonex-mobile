/** Stable Android package identity required by YouTube's embedded-player policy. */
export const LECTURE_PLAYER_ORIGIN = 'https://com.medonex.app';

/** Only packaged HTML enters this function. No account credentials enter the media surface. */
export function nativeLecturePlayerDocument(html: string, scope: string): string {
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(scope)) throw Error('Invalid media scope');
  return html
    .replace('<head>', '<head><script>window.__LECTURE_SCOPE__=' + JSON.stringify(scope) + ';</script>')
    .replace(/<base href="[^"]*">/, '<base href="' + LECTURE_PLAYER_ORIGIN + '/">');
}
