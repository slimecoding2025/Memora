import { supabase } from './supabase'

export interface Draft {
  title: string; content: string; type: string; source_url: string | null; collection_id: string | null; tags: string[]
}
const KEY = 'memora:queue'
const read = (): Draft[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Draft[] } catch { return [] } }
const write = (q: Draft[]) => {
  localStorage.setItem(KEY, JSON.stringify(q))
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('memora-queue'))
}
/** Memories waiting on this device to be synced. */
export const pending = read
export function discardPending(index: number) { write(read().filter((_, i) => i !== index)) }

async function saveMemory(d: Draft): Promise<string | null> {
  const { tags, ...row } = d
  const { data: mem, error } = await supabase.from('memories').insert(row).select('id').single()
  if (error || !mem) return null
  if (tags.length) {
    const { data: saved } = await supabase.from('tags').upsert(tags.map(name => ({ name })), { onConflict: 'user_id,name' }).select('id')
    if (saved) await supabase.from('memory_tags').insert(saved.map((t: { id: string }) => ({ memory_id: mem.id, tag_id: t.id })))
  }
  return mem.id as string
}

/** Saves now when online; otherwise keeps the memory on this device until flush() runs. */
export async function submit(d: Draft): Promise<{ status: 'saved' | 'queued' | 'failed'; id?: string }> {
  if (!navigator.onLine) { write([...read(), d]); return { status: 'queued' } }
  const id = await saveMemory(d)
  return id ? { status: 'saved', id } : { status: 'failed' }
}

let flushing = false
export async function flush(): Promise<number> {
  if (flushing || !navigator.onLine || read().length === 0) return 0
  flushing = true
  let done = 0
  const rest: Draft[] = []
  for (const d of read()) { if (await saveMemory(d)) done++; else rest.push(d) }
  write(rest); flushing = false
  return done
}
