import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDocumentsSignedUrl,
  invalidateDocumentsSignedUrlCache,
} from '@/lib/storage/documents-signed-url-cache'

function mockSupabase(signedUrl: string) {
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: signedUrl },
    error: null,
  })
  return {
    storage: {
      from: vi.fn().mockReturnValue({ createSignedUrl }),
    },
    createSignedUrlMock: createSignedUrl,
  } as const
}

describe('documents-signed-url-cache', () => {
  const originalSessionStorage = globalThis.sessionStorage

  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal(
      'sessionStorage',
      {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v)
        },
      } as Storage,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalSessionStorage) {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: originalSessionStorage,
        configurable: true,
      })
    }
  })

  it('calls createSignedUrl once for the same path and ttl', async () => {
    const { storage, createSignedUrlMock } = mockSupabase('https://cdn.example/p1?sig=a')
    const supabase = { storage } as Parameters<typeof getDocumentsSignedUrl>[0]

    const u1 = await getDocumentsSignedUrl(supabase, 'patients/x/1.png', 3600)
    const u2 = await getDocumentsSignedUrl(supabase, 'patients/x/1.png', 3600)

    expect(u1).toBe('https://cdn.example/p1?sig=a')
    expect(u2).toBe(u1)
    expect(createSignedUrlMock).toHaveBeenCalledTimes(1)
  })

  it('fetches again after invalidateDocumentsSignedUrlCache', async () => {
    const { storage, createSignedUrlMock } = mockSupabase('https://cdn.example/p2?sig=b')
    const supabase = { storage } as Parameters<typeof getDocumentsSignedUrl>[0]
    const path = 'patients/y/2.png'

    await getDocumentsSignedUrl(supabase, path, 60)
    invalidateDocumentsSignedUrlCache(path)
    await getDocumentsSignedUrl(supabase, path, 60)

    expect(createSignedUrlMock).toHaveBeenCalledTimes(2)
  })

  it('uses different cache entries for different ttl', async () => {
    const { storage, createSignedUrlMock } = mockSupabase('https://cdn.example/p3?sig=c')
    const supabase = { storage } as Parameters<typeof getDocumentsSignedUrl>[0]
    const path = 'patients/z/3.png'

    await getDocumentsSignedUrl(supabase, path, 60)
    await getDocumentsSignedUrl(supabase, path, 3600)

    expect(createSignedUrlMock).toHaveBeenCalledTimes(2)
  })
})
