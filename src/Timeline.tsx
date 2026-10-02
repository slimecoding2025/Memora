import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { supabase } from './lib/supabase'
import type { Memory } from './types'

const DAY = 86_400_000
function bucket(iso: string): string {
  const age = Date.now() - new Date(iso).getTime()
  if (age < DAY) return 'Today'
  if (age < 7 * DAY) return 'This week'
  if (age < 30 * DAY) return 'This month'
  if (age < 365 * DAY) return 'This year'
  return 'Earlier'
}

export default function Timeline() {
  const [items, setItems] = useState<Memory[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('memories').select('id,title,content,type,source_url,is_favorite,is_archived,created_at')
      .eq('is_archived', false).order('created_at', { ascending: false }).limit(200)
      .then(({ data, error: e }) => { if (e) setError('Could not load your timeline. Your memories are safe, try again.'); else setItems(data as Memory[]) })
  }, [])

  if (error) return <p role="alert" className="p-6 text-sm text-danger">{error}</p>
  if (!items) return <p className="p-6 text-muted">Loading…</p>
  if (items.length === 0) return <p className="p-10 text-center text-muted">Your timeline is empty. Save a memory and it appears here.</p>

  const groups = new Map<string, Memory[]>()
  items.forEach(m => groups.set(bucket(m.created_at), [...(groups.get(bucket(m.created_at)) ?? []), m]))

  return (
    <div className="max-w-2xl px-4 py-6">
      <h1 className="font-display text-3xl">Timeline</h1>
      {[...groups].map(([name, list]) => (
        <section key={name} className="mt-8" aria-label={name}>
          <h2 className="mb-3 font-medium text-accent">{name}</h2>
          <ol className="space-y-4 border-l border-line pl-5">
            {list.map(m => (
              <motion.li key={m.id} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-muted">{m.type} · {new Date(m.created_at).toLocaleString()}</p>
                {m.content && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.content}</p>}
              </motion.li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
