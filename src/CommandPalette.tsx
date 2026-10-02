import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { supabase } from './lib/supabase'

const PAGES = [['Memories', '#/app'], ['Collections', '#/app/collections'], ['Timeline', '#/app/timeline'], ['Graph', '#/app/graph'], ['Account', '#/app/account']]
interface Item { label: string; hint: string; href: string }

export default function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [text, setText] = useState('')
  const [found, setFound] = useState<Item[]>([])
  const [idx, setIdx] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(!open) }
      else if (e.key === 'Escape') setOpen(false)
    }
    addEventListener('keydown', f)
    return () => removeEventListener('keydown', f)
  }, [open, setOpen])

  useEffect(() => {
    if (open) { opener.current = document.activeElement as HTMLElement | null; setText(''); setIdx(0); setTimeout(() => input.current?.focus(), 0) }
    else opener.current?.focus()
  }, [open])

  useEffect(() => {
    const t = text.replace(/[%_,()]/g, '').trim()
    if (t.length < 2) { setFound([]); return }
    const id = setTimeout(async () => {
      const { data } = await supabase.from('memories').select('id,title').ilike('title', `%${t}%`).limit(5)
      setFound((data ?? []).map((m: { id: string; title: string }) => ({ label: m.title, hint: 'Memory', href: `#/app?q=${encodeURIComponent(m.title)}` })))
    }, 200)
    return () => clearTimeout(id)
  }, [text])

  const pages = PAGES.filter(([l]) => l.toLowerCase().includes(text.toLowerCase())).map(([label, href]) => ({ label, hint: 'Go to', href }))
  const items: Item[] = [...pages, ...found]
  const choose = (i?: Item) => { if (i) { location.hash = i.href; setOpen(false) } }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setOpen(false)}>
          <motion.div role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={e => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
            initial={{ scale: 0.97, y: -8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }}>
            <input ref={input} role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={items[idx] ? `opt-${idx}` : undefined} className="w-full border-b border-line bg-transparent px-4 py-3 text-sm" placeholder="Search memories or jump to a page…" aria-label="Search"
              value={text} onChange={e => { setText(e.target.value); setIdx(0) }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(Math.min(idx + 1, items.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(Math.max(idx - 1, 0)) }
                else if (e.key === 'Enter') choose(items[idx])
                else if (e.key === 'Tab') e.preventDefault()
              }} />
            <ul id="palette-list" role="listbox" className="max-h-80 overflow-auto p-2">
              {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nothing found.</li>}
              {items.map((it, i) => (
                <li key={it.href + i} id={`opt-${i}`} role="option" aria-selected={i === idx} onMouseEnter={() => setIdx(i)} onClick={() => choose(it)}
                  className={`flex cursor-pointer justify-between gap-3 rounded-md px-3 py-2 text-sm ${i === idx ? 'bg-raised text-accent' : ''}`}>
                  <span className="truncate">{it.label}</span><span className="shrink-0 text-xs text-muted">{it.hint}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
