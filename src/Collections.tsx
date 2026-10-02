import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { supabase } from './lib/supabase'

interface Col { id: string; name: string; description: string | null; memories: { count: number }[] }
const NewCol = z.object({ name: z.string().trim().min(1, 'Add a name.').max(80), description: z.string().trim().max(500) })

export default function Collections() {
  const [cols, setCols] = useState<Col[] | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('collections').select('id,name,description,memories(count)').order('name')
    if (error) setErr('Could not load your collections. Try again.'); else setCols(data as unknown as Col[])
  }, [])
  useEffect(() => { void load() }, [load])

  async function create(e: FormEvent) {
    e.preventDefault(); setErr('')
    const parsed = NewCol.safeParse({ name, description: desc })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    const { error } = await supabase.from('collections').insert({ name: parsed.data.name, description: parsed.data.description || null })
    if (error) return setErr(error.code === '23505' ? 'You already have a collection with that name.' : 'Could not create the collection. Try again.')
    setName(''); setDesc(''); void load()
  }
  async function remove(id: string) {
    if (!confirm('Delete this collection? Its memories are kept.')) return
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (error) setErr('Could not delete the collection.'); else void load()
  }

  return (
    <div className="max-w-2xl px-4 py-6">
      <h1 className="font-display text-3xl">Collections</h1>
      <form onSubmit={create} className="mt-5 flex flex-wrap gap-2" aria-label="New collection">
        <input className="field w-48 flex-none" placeholder="Name, e.g. Cybersecurity" aria-label="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="field min-w-0 flex-1" placeholder="Description (optional)" aria-label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <button className="btn-primary">Create collection</button>
      </form>
      {err && <p role="alert" className="mt-3 text-sm text-danger">{err}</p>}
      {!cols ? <p className="mt-6 text-muted">Loading…</p>
        : cols.length === 0 ? <p className="mt-10 text-muted">No collections yet. Create one above, then file memories into it.</p>
        : (
          <ul className="mt-6 space-y-3">
            {cols.map(c => (
              <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-line bg-surface p-4">
                <a href={`#/app?collection=${c.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted">{c.memories[0]?.count ?? 0} memories</p>
                  {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
                </a>
                <button className="btn" aria-label={`Delete ${c.name}`} onClick={() => remove(c.id)}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
