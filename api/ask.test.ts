import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const memories = [{ id: 'a', title: 'Python sockets', content: 'TCP client and server' }]
  const builder = (result: unknown) => {
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'gte', 'textSearch', 'limit', 'insert', 'order', 'is']) b[m] = () => b
    b.then = (ok: (v: unknown) => unknown) => Promise.resolve(result).then(ok)
    return b
  }
  return { memories, builder }
})
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (t: string) => h.builder(t === 'memories' ? { data: h.memories } : { data: null, count: 0 }),
    rpc: async () => ({ data: [] })
  })
}))
import handler from './ask'

function run(req: object) {
  const r = { code: 200, body: undefined as unknown, status(c: number) { r.code = c; return r }, json(b: unknown) { r.body = b; return r } }
  return Promise.resolve(handler(req as never, r as never)).then(() => r)
}
const post = (body: unknown, auth = 'Bearer token') => ({ method: 'POST', headers: auth ? { authorization: auth } : {}, body })
const chat = (content: unknown) => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }], usage: {} }) })

beforeEach(() => {
  process.env.VITE_SUPABASE_URL = 'http://localhost'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon'
  process.env.OPENROUTER_API_KEY = 'test'
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('embeddings') ? { ok: false } : chat({ answer: 'Use sockets.', sources: ['a', 'ghost'] }))))
})

describe('/api/ask', () => {
  it('rejects non-POST requests', async () => expect((await run({ method: 'GET', headers: {} })).code).toBe(405))
  it('requires a signed-in user', async () => expect((await run(post({ question: 'python?' }, ''))).code).toBe(401))
  it('validates the question', async () => expect((await run(post({ question: 'hi' }))).code).toBe(400))
  it('drops source ids the model invented', async () => {
    const r = await run(post({ question: 'python?' }))
    expect(r.code).toBe(200)
    expect(r.body).toEqual({ answer: 'Use sockets.', sources: [{ id: 'a', title: 'Python sockets' }] })
  })
  it('hides upstream errors behind a friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    const r = await run(post({ question: 'python?' }))
    expect(r.code).toBe(503)
    expect(JSON.stringify(r.body)).toContain('temporarily unavailable')
  })
  it('reports a reference code for upstream failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 402 })))
    expect((await run(post({ question: 'python?' }))).body).toMatchObject({ code: 'upstream_402' })
  })
  it('accepts JSON wrapped in code fences', async () => {
    const fenced = '```json\n{"answer":"Fenced.","sources":["a"]}\n```'
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('embeddings') ? { ok: false } : { ok: true, json: async () => ({ choices: [{ message: { content: fenced } }], usage: {} }) })))
    expect((await run(post({ question: 'python?' }))).body).toEqual({ answer: 'Fenced.', sources: [{ id: 'a', title: 'Python sockets' }] })
  })
})
