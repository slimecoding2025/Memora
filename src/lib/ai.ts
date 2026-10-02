import { supabase } from './supabase'

/** Asks the server to create embeddings for memories that have none. Returns null if AI is unavailable. */
export async function indexMemories(): Promise<{ done: number; remaining: number } | null> {
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null
    const r = await fetch('/api/embed', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } })
    return r.ok ? ((await r.json()) as { done: number; remaining: number }) : null
  } catch { return null }
}
