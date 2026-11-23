const listeners = new Map<string, () => void>();
/** Local playback ownership only. No network, account or persistent state. */
export function listenForOtherMedia(owner: string, pause: () => void) { listeners.set(owner, pause); return () => { if (listeners.get(owner) === pause) listeners.delete(owner); }; }
export function announceMediaPlaying(owner: string) { for (const [id, pause] of [...listeners]) if (id !== owner) pause(); }
