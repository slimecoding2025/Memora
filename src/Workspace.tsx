import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, Paperclip, Pencil, LogOut, Moon, Sparkles, Star, Sun, Trash2 } from 'lucide-react'
import { NewMemory, parseTags } from './lib/validation'
import { flush, submit } from './lib/offline'
import Markdown from './Markdown'
import Editor from './Editor'
import Voice from './Voice'
import { indexMemories } from './lib/ai'
import { notify } from './lib/notify'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Memory, MemoryType } from './types'
import Files, { ALLOWED, MAX, send } from './Files'

type Opt = { id: string; name: string }

type View = 'all' | 'favorites' | 'archive'
interface Answer { answer: string; sources: { id: string; title: string }[] }

export default function Workspace({ session }: { session: Session }) {
  const [items, setItems] = useState<Memory[]>([])
  const [view, setView] = useState<View>('all')
  const [q, setQ] = useState(() => new URLSearchParams(location.hash.split('?')[1]).get('q') ?? '')
  const [col, setCol] = useState(() => new URLSearchParams(location.hash.split('?')[1]).get('collection') ?? '')
  const [tag, setTag] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [filesFor, setFilesFor] = useState<string | null>(null)
  const [cols, setCols] = useState<Opt[]>([])
  const [tags, setTags] = useState<Opt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [theme, setTheme] = useState(document.documentElement.dataset.theme)

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])

  const load = useCallback(async (term: string, v: View, c: string, tg: string) => {
    setLoading(true); setError('')
    let query = supabase.from('memories')
      .select('id,title,content,type,source_url,is_favorite,is_archived,created_at,version,collection_id,collections(name),memory_tags(tags(id,name))')
      .eq('is_archived', v === 'archive').order('created_at', { ascending: false }).limit(50)
    if (v === 'favorites') query = query.eq('is_favorite', true)
    if (c) query = query.eq('collection_id', c)
    if (tg) {
      const { data: links } = await supabase.from('memory_tags').select('memory_id,tags!inner(name)').eq('tags.name', tg)
      query = query.in('id', (links ?? []).map((l: { memory_id: string }) => l.memory_id))
    }
    if (term.trim()) query = query.textSearch('search', term.trim(), { type: 'websearch', config: 'simple' })
    const { data, error: e } = await query
    if (e) setError('Could not load your memories. They are safe, try again.')
    else setItems(data as unknown as Memory[])
    setLoading(false)
  }, [])

  const loadMeta = useCallback(async () => {
    const [c, t] = await Promise.all([
      supabase.from('collections').select('id,name').order('name'),
      supabase.from('tags').select('id,name').order('name')
    ])
    setCols((c.data ?? []) as Opt[]); setTags((t.data ?? []) as Opt[])
  }, [])
  useEffect(() => { void loadMeta() }, [loadMeta])

  useEffect(() => { // Smart rediscovery: once a day, resurface an older memory
    const today = new Date().toDateString()
    if (localStorage.getItem('memora:rediscover') === today) return
    supabase.from('memories').select('title').eq('is_archived', false)
      .lt('created_at', new Date(Date.now() - 7 * 86_400_000).toISOString()).limit(30)
      .then(({ data }) => {
        if (!data?.length) return
        localStorage.setItem('memora:rediscover', today)
        notify(`Remember this? “${data[Math.floor(Math.random() * data.length)].title}”`)
      })
  }, [])

  useEffect(() => {
    const run = () => void flush().then(n => { if (n) { notify(`${n} memories saved offline were synced.`); void indexMemories(); void load(q, view, col, tag) } })
    run(); addEventListener('online', run)
    return () => removeEventListener('online', run)
  }, [q, view, col, tag, load])

  useEffect(() => {
    const t = setTimeout(() => void load(q, view, col, tag), 250) // debounce
    return () => clearTimeout(t)
  }, [q, view, col, tag, load])

  async function patch(id: string, change: Partial<Memory>) {
    const { error: e } = await supabase.from('memories').update(change).eq('id', id)
    if (e) setError('Could not save that change.'); else void load(q, view, col, tag)
  }
  async function remove(id: string) {
    if (!confirm('Delete this memory permanently?')) return
    const dir = `${session.user.id}/${id}`
    const { data: stored } = await supabase.storage.from('attachments').list(dir)
    if (stored?.length) await supabase.storage.from('attachments').remove(stored.map(f => `${dir}/${f.name}`))
    const { error: e } = await supabase.from('memories').delete().eq('id', id)
    if (e) setError('Could not delete that memory.'); else void load(q, view, col, tag)
  }
  async function removeTag(memoryId: string, tagId: string) {
    const { error: e } = await supabase.from('memory_tags').delete().eq('memory_id', memoryId).eq('tag_id', tagId)
    if (e) setError('Could not remove that tag.'); else void load(q, view, col, tag)
  }
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next; localStorage.setItem('theme', next); setTheme(next)
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-4">
      <header className="hidden">
        <h1 className="font-display text-2xl">MEMORA</h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          {!online && <span role="status" className="text-accent">Offline</span>}
          <span className="hidden sm:inline">{session.user.email}</span>
          <button className="btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button className="btn" aria-label="Sign out" onClick={() => supabase.auth.signOut()}><LogOut size={16} /></button>
        </div>
      </header>

      <Capture cols={cols} onSaved={() => { void load(q, view, col, tag); void loadMeta(); void indexMemories() }} />
      <AskPanel token={session.access_token} onOpen={t => { setQ(t); setView('all') }} />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(['all', 'favorites', 'archive'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
            className={`btn capitalize ${view === v ? 'border-accent' : ''}`}>{v}</button>
        ))}
        <select className="field w-auto" aria-label="Filter by collection" value={col} onChange={e => setCol(e.target.value)}>
          <option value="">All collections</option>{cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="field w-auto" aria-label="Filter by tag" value={tag} onChange={e => setTag(e.target.value)}>
          <option value="">All tags</option>{tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <input className="field ml-auto w-full sm:w-64" type="search" placeholder="Search memories" aria-label="Search memories" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <p className="sr-only" role="status">{loading ? 'Loading memories' : `${items.length} memories shown`}</p>
      {loading ? <p className="mt-6 text-muted">Loading…</p>
        : items.length === 0 ? <p className="mt-10 text-center text-muted">{q ? 'No memories match your search.' : 'Nothing here yet. Capture your first idea above.'}</p>
        : (
          <ul className="mt-4 space-y-3">
            <AnimatePresence initial={false}>
              {items.map(m => (
                <motion.li key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="rounded-lg border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-medium">{m.title}</h2>
                      <p className="text-xs text-muted">{m.type} · {new Date(m.created_at).toLocaleDateString()}{m.collections ? ` · ${m.collections.name}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button className="btn" aria-label="Favorite" aria-pressed={m.is_favorite} onClick={() => patch(m.id, { is_favorite: !m.is_favorite })}><Star size={14} className={m.is_favorite ? 'fill-current text-accent' : ''} /></button>
                      <button className="btn" aria-label={m.is_archived ? 'Restore' : 'Archive'} onClick={() => patch(m.id, { is_archived: !m.is_archived })}><Archive size={14} /></button>
                      <button className="btn" aria-label="Edit" onClick={() => setEditing(editing === m.id ? null : m.id)}><Pencil size={14} /></button>
                      <button className="btn" aria-label="Files" onClick={() => setFilesFor(filesFor === m.id ? null : m.id)}><Paperclip size={14} /></button>
                      <button className="btn" aria-label="Delete" onClick={() => remove(m.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {m.content && <div className="mt-2"><Markdown text={m.content.slice(0, 600)} /></div>}
                  {editing === m.id && <EditForm m={m} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(q, view, col, tag); void indexMemories() }} />}
                  {filesFor === m.id && <Files userId={session.user.id} memoryId={m.id} />}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {m.memory_tags?.map(mt => mt.tags && (
                      <span key={mt.tags.id} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">#{mt.tags.name}
                        <button className="ml-1" aria-label={`Remove tag ${mt.tags.name}`} onClick={() => removeTag(m.id, mt.tags!.id)}>×</button>
                      </span>
                    ))}
                    <select className="rounded border border-line bg-surface px-1 py-0.5 text-xs text-muted" aria-label="Move to collection"
                      value={m.collection_id ?? ''} onChange={e => patch(m.id, { collection_id: e.target.value || null })}>
                      <option value="">No collection</option>{cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {m.source_url && <a className="mt-2 inline-block break-all text-sm text-accent underline" href={m.source_url} target="_blank" rel="noopener noreferrer">{m.source_url}</a>}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
    </div>
  )
}

function Capture({ cols, onSaved }: { cols: Opt[]; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<MemoryType>('note')
  const [url, setUrl] = useState('')
  const [collection, setCollection] = useState('')
  const [tagText, setTagText] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function pick(f: File | null) {
    setErr('')
    if (f && f.size > MAX) return setErr('That file is larger than 10 MB.')
    if (f && !ALLOWED.includes(f.type)) return setErr('Use an image, PDF, text, Word or audio file.')
    setFile(f)
  }

  async function save(e: FormEvent) {
    e.preventDefault(); setErr('')
    const parsed = NewMemory.safeParse({ title, content, type, source_url: url.trim() || null })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    setBusy(true)
    if (file && !navigator.onLine) { setBusy(false); return setErr('Voice notes, images and documents need an internet connection.') }
    const result = await submit({ ...parsed.data, collection_id: collection || null, tags: parseTags(tagText) })
    setBusy(false)
    if (result.status === 'failed') return setErr('Could not save. Your text is still here, try again.')
    if (file && result.id) {
      const { data: s } = await supabase.auth.getSession()
      const ok = s.session ? await send(`${s.session.user.id}/${result.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`, file, s.session.access_token, () => undefined) : false
      if (!ok) setErr('The memory was saved, but the file did not upload. Open it and attach the file again.')
    }
    setNote(result.status === 'queued' ? 'Saved on this device. It will sync when you are back online.' : '')
    setTitle(''); setContent(''); setUrl(''); setTagText(''); setFile(null); onSaved()
  }

  return (
    <form onSubmit={save} className="space-y-2 rounded-lg border border-line bg-surface p-4" aria-label="Quick capture">
      <input className="field" placeholder="Capture an idea, link or note…" aria-label="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <Editor value={content} onChange={setContent} />
      <div className="flex flex-wrap gap-2">
        <select className="field w-auto" aria-label="Type" value={type} onChange={e => { setType(e.target.value as MemoryType); setFile(null) }}>
          {['note', 'idea', 'link', 'quote', 'image', 'document', 'voice'].map(t => <option key={t}>{t}</option>)}
        </select>
        <input className="field min-w-0 flex-1" placeholder="Link (optional)" aria-label="Link" value={url} onChange={e => setUrl(e.target.value)} />
        <select className="field w-auto" aria-label="Collection" value={collection} onChange={e => setCollection(e.target.value)}>
          <option value="">No collection</option>{cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="field min-w-0 flex-1" placeholder="Tags, separated by commas" aria-label="Tags" value={tagText} onChange={e => setTagText(e.target.value)} />
        <button className="btn-primary" disabled={busy}>Save memory</button>
      </div>
      {(type === 'image' || type === 'document') && (
        <input type="file" className="field" aria-label="File" accept={type === 'image' ? 'image/*' : '.pdf,.txt,.docx'} onChange={e => pick(e.target.files?.[0] ?? null)} />
      )}
      {type === 'voice' && <Voice onFile={pick} />}
      {note && <p role="status" className="text-sm text-accent">{note}</p>}
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </form>
  )
}

function AskPanel({ token, onOpen }: { token: string; onOpen: (title: string) => void }) {
  const [question, setQuestion] = useState('')
  const [res, setRes] = useState<Answer | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function ask(e: FormEvent) {
    e.preventDefault(); setErr(''); setRes(null)
    if (question.trim().length < 3) return
    setBusy(true)
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ question }) })
      const data = await r.json()
      if (!r.ok) setErr(`${data.error ?? 'AI is temporarily unavailable. Your memories are safe.'}${data.code ? ` (ref: ${data.code})` : ''}`)
      else setRes(data as Answer)
    } catch { setErr('AI is temporarily unavailable. Your memories are safe. (ref: no_response)') }
    setBusy(false)
  }

  return (
    <section className="mt-4 rounded-lg border border-line bg-surface p-4" aria-label="Ask your memories">
      <form onSubmit={ask} className="flex gap-2">
        <input className="field" placeholder="Ask your memories, e.g. what did I save about Python?" aria-label="Question" value={question} onChange={e => setQuestion(e.target.value)} />
        <button className="btn-primary flex items-center gap-1" disabled={busy}><Sparkles size={14} />{busy ? 'Thinking…' : 'Ask'}</button>
      </form>
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
      {res && (
        <div className="mt-3 text-sm">
          <p className="text-xs text-muted">AI-generated answer, based only on your memories</p>
          <p className="mt-1 whitespace-pre-wrap">{res.answer}</p>
          {res.sources.length > 0 && <p className="mt-2 text-muted">Sources: {res.sources.map(s => (
            <button key={s.id} className="mr-2 text-accent underline" onClick={() => onOpen(s.title)}>{s.title}</button>))}</p>}
        </div>
      )}
    </section>
  )
}

function EditForm({ m, onClose, onSaved }: { m: Memory; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(m.title)
  const [content, setContent] = useState(m.content)
  const [url, setUrl] = useState(m.source_url ?? '')
  const [err, setErr] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault(); setErr('')
    const parsed = NewMemory.safeParse({ title, content, type: m.type, source_url: url.trim() || null })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    // Only update if nobody changed it since we loaded it, so newer data is never overwritten.
    const { data, error } = await supabase.from('memories')
      .update({ title: parsed.data.title, content: parsed.data.content, source_url: parsed.data.source_url })
      .eq('id', m.id).eq('version', m.version).select('id')
    if (error) return setErr('Could not save. Your changes are still here, try again.')
    if (!data?.length) return setErr('This memory was changed somewhere else. Close this editor and reopen it to see the latest version.')
    onSaved()
  }

  return (
    <form onSubmit={save} className="mt-3 space-y-2 rounded-md border border-line bg-raised p-3" aria-label="Edit memory">
      <input className="field" aria-label="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <Editor value={content} onChange={setContent} />
      <p className="text-xs text-muted">Markdown works: **bold**, *italic*, `code`, # heading, - list, [text](https://link)</p>
      <input className="field" placeholder="Link (optional)" aria-label="Link" value={url} onChange={e => setUrl(e.target.value)} />
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <div className="flex gap-2"><button className="btn-primary">Save changes</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
    </form>
  )
}
