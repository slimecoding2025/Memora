import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { supabase } from './lib/supabase'
import type { Memory } from './types'

const tagsOf = (m: Memory) => m.memory_tags?.flatMap(t => (t.tags ? [t.tags.name] : [])) ?? []

function build(items: Memory[]) {
  const tags = items.map(tagsOf)
  const edges: [number, number][] = []
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
    const sameCol = !!items[a].collection_id && items[a].collection_id === items[b].collection_id
    if (sameCol || tags[a].some(t => tags[b].includes(t))) edges.push([a, b])
  }
  const n = items.length
  const p = items.map((_, i) => ({ x: Math.cos(i * 2.4) * (40 + i * 3), y: Math.sin(i * 2.4) * (40 + i * 3), vx: 0, vy: 0 }))
  for (let it = 0; it < 250; it++) {
    const cool = 1 - it / 250
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      const dx = p[a].x - p[b].x, dy = p[a].y - p[b].y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2), f = 2500 / d2
      p[a].vx += (dx / d) * f; p[a].vy += (dy / d) * f; p[b].vx -= (dx / d) * f; p[b].vy -= (dy / d) * f
    }
    for (const [a, b] of edges) {
      const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y
      p[a].vx += dx * 0.01; p[a].vy += dy * 0.01; p[b].vx -= dx * 0.01; p[b].vy -= dy * 0.01
    }
    for (const q of p) {
      q.vx -= q.x * 0.01; q.vy -= q.y * 0.01
      q.x += Math.max(-20, Math.min(20, q.vx)) * cool; q.y += Math.max(-20, Math.min(20, q.vy)) * cool
      q.vx = 0; q.vy = 0
    }
  }
  return { pos: p, edges }
}

export default function Graph() {
  const [items, setItems] = useState<Memory[] | null>(null)
  const [error, setError] = useState('')
  const [sel, setSel] = useState<Memory | null>(null)
  const [text, setText] = useState('')
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    supabase.from('memories').select('id,title,content,type,source_url,is_favorite,is_archived,created_at,collection_id,collections(name),memory_tags(tags(id,name))')
      .eq('is_archived', false).order('created_at', { ascending: false }).limit(150)
      .then(({ data, error: e }) => { if (e) setError('Could not load your graph. Your memories are safe, try again.'); else setItems(data as unknown as Memory[]) })
  }, [])

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const wheel = (e: WheelEvent) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.1 : 0.9) }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  })
  const zoom = (f: number) => setView(v => ({ ...v, k: Math.max(0.3, Math.min(4, v.k * f)) }))
  const g = useMemo(() => (items ? build(items) : null), [items])

  if (error) return <p role="alert" className="p-6 text-sm text-red-400">{error}</p>
  if (!items || !g) return <p className="p-6 text-muted">Loading…</p>
  if (items.length < 2) return <p className="p-10 text-muted">Save at least two memories with shared tags or a shared collection to see them connect.</p>

  const match = (m: Memory) => !text.trim() || m.title.toLowerCase().includes(text.trim().toLowerCase())
  return (
    <div className="max-w-4xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Graph</h1>
        <div className="flex items-center gap-2">
          <input className="field w-48" type="search" placeholder="Find a memory" aria-label="Find a memory" value={text} onChange={e => setText(e.target.value)} />
          <button className="btn" aria-label="Zoom in" onClick={() => zoom(1.25)}><Plus size={14} /></button>
          <button className="btn" aria-label="Zoom out" onClick={() => zoom(0.8)}><Minus size={14} /></button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">Memories connect through shared tags or the same collection. Drag to pan, scroll to zoom, click a memory to open it.</p>
      <svg ref={svg} role="img" aria-label="Graph of connected memories" className="mt-4 h-[60vh] w-full cursor-grab touch-none rounded-lg border border-line bg-surface"
        viewBox={`${view.x - 400 / view.k} ${view.y - 280 / view.k} ${800 / view.k} ${560 / view.k}`}
        onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={() => { drag.current = null }}
        onPointerMove={e => {
          if (!drag.current) return
          const s = 800 / view.k / e.currentTarget.getBoundingClientRect().width
          const dx = (e.clientX - drag.current.x) * s, dy = (e.clientY - drag.current.y) * s
          drag.current = { x: e.clientX, y: e.clientY }
          setView(v => ({ ...v, x: v.x - dx, y: v.y - dy }))
        }}>
        {g.edges.map(([a, b]) => <line key={`${a}-${b}`} x1={g.pos[a].x} y1={g.pos[a].y} x2={g.pos[b].x} y2={g.pos[b].y} stroke="var(--line)" strokeWidth="1" />)}
        {items.map((m, i) => (
          <g key={m.id} opacity={match(m) ? 1 : 0.2} className="cursor-pointer" onClick={() => setSel(m)}>
            <circle cx={g.pos[i].x} cy={g.pos[i].y} r={sel?.id === m.id ? 10 : 7} fill={sel?.id === m.id ? 'var(--accent)' : 'var(--raised)'} stroke="var(--accent)" strokeWidth="1.5" />
            <text x={g.pos[i].x} y={g.pos[i].y + 20} textAnchor="middle" fontSize="10" fill="var(--muted)">{m.title.slice(0, 20)}</text>
          </g>
        ))}
      </svg>
      {sel && (
        <div className="mt-4 rounded-lg border border-line bg-surface p-4">
          <h2 className="font-medium">{sel.title}</h2>
          <p className="text-xs text-muted">{sel.collections?.name ?? 'No collection'} · {tagsOf(sel).map(t => `#${t}`).join(' ')}</p>
          {sel.content && <p className="mt-2 line-clamp-3 text-sm text-muted">{sel.content}</p>}
          <a className="btn-primary mt-3 inline-block" href={`#/app?q=${encodeURIComponent(sel.title)}`}>Open in memories</a>
        </div>
      )}
    </div>
  )
}
