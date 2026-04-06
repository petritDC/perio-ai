import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'documents'
/** Refresh before JWT expiry so users rarely hit a dead link. */
const SAFETY_MS = 90_000
const SESSION_KEY = 'perio:documents-signed-urls:v1'

type CachedEntry = { url: string; expiresAtMs: number }

const memory = new Map<string, CachedEntry>()

function makeKey(filePath: string, ttlSec: number): string {
  return JSON.stringify([BUCKET, filePath, ttlSec])
}

function isUsable(entry: CachedEntry): boolean {
  return entry.expiresAtMs > Date.now()
}

function readSession(): Record<string, CachedEntry> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CachedEntry>
  } catch {
    return {}
  }
}

function writeSession(data: Record<string, CachedEntry>): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // Quota or private mode — memory cache still helps.
  }
}

function pruneExpired(rec: Record<string, CachedEntry>): Record<string, CachedEntry> {
  const now = Date.now()
  const next: Record<string, CachedEntry> = {}
  for (const [k, v] of Object.entries(rec)) {
    if (v.expiresAtMs > now) next[k] = v
  }
  return next
}

function remember(key: string, url: string, ttlSec: number): void {
  const expiresAtMs = Date.now() + ttlSec * 1000 - SAFETY_MS
  const entry: CachedEntry = { url, expiresAtMs }
  memory.set(key, entry)
  const session = pruneExpired(readSession())
  session[key] = entry
  writeSession(session)
}

/**
 * Reuses signed URLs across navigations and tabs (sessionStorage) so image
 * requests hit the same URL and browser HTTP cache can serve bytes.
 */
export async function getDocumentsSignedUrl(
  supabase: SupabaseClient,
  filePath: string,
  ttlSec: number,
): Promise<string | null> {
  const key = makeKey(filePath, ttlSec)

  const memHit = memory.get(key)
  if (memHit && isUsable(memHit)) return memHit.url

  const session = pruneExpired(readSession())
  const diskHit = session[key]
  if (diskHit && isUsable(diskHit)) {
    memory.set(key, diskHit)
    return diskHit.url
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, ttlSec)

  if (error || !data?.signedUrl) return null

  remember(key, data.signedUrl, ttlSec)
  return data.signedUrl
}

/** Call when a file is removed so we do not reuse stale paths. */
export function invalidateDocumentsSignedUrlCache(filePath: string): void {
  for (const k of memory.keys()) {
    try {
      const parts = JSON.parse(k) as unknown[]
      if (parts[0] === BUCKET && parts[1] === filePath) memory.delete(k)
    } catch {
      memory.delete(k)
    }
  }

  const session = readSession()
  let changed = false
  for (const k of Object.keys(session)) {
    try {
      const parts = JSON.parse(k) as unknown[]
      if (parts[0] === BUCKET && parts[1] === filePath) {
        delete session[k]
        changed = true
      }
    } catch {
      delete session[k]
      changed = true
    }
  }
  if (changed) writeSession(session)
}
