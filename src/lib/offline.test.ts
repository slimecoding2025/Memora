import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: { from: vi.fn() } }))
const store = new Map<string, string>()
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) })

const draft = { title: 'Offline idea', content: '', type: 'note', source_url: null, collection_id: null, tags: [] }

describe('offline queue', () => {
  beforeEach(() => { store.clear(); vi.stubGlobal('navigator', { onLine: false }) })

  it('keeps a memory on the device while offline', async () => {
    const { submit } = await import('./offline')
    expect((await submit(draft)).status).toBe('queued')
    expect(JSON.parse(store.get('memora:queue') ?? '[]')).toHaveLength(1)
  })
  it('does not sync while offline', async () => {
    const { flush } = await import('./offline')
    expect(await flush()).toBe(0)
  })
})
