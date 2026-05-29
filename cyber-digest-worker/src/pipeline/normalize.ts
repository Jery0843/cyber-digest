import type { Env, CyberEvent } from '../types';

export async function normalizeEvents(events: CyberEvent[]): Promise<CyberEvent[]> {
  // Pass through for now, but in a real system we might standardize vendor names here
  // e.g., "Microsoft Corporation" -> "Microsoft"
  return events;
}
