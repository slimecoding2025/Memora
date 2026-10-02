import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { indexMemories } from './lib/ai'
import { notify } from './lib/notify'

export default function Account({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [pw, setPw] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 8) return setMsg({ ok: false, text: 'Use at least 8 characters.' })
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setMsg({ ok: false, text: 'Could not change the password. Sign in again and retry.' })
    else { setMsg({ ok: true, text: 'Password updated.' }); setPw('') }
  }

  async function reindex() {
    setIndexing(true); setMsg(null)
    let total = 0
    for (let i = 0; i < 30; i++) {
      const r = await indexMemories()
      if (!r) { setIndexing(false); return setMsg({ ok: false, text: 'AI is temporarily unavailable. Your memories are safe.' }) }
      total += r.done
      if (r.remaining === 0) break
    }
    setIndexing(false); setMsg({ ok: true, text: `Indexed ${total} memories.` }); notify(`Indexed ${total} memories for AI search.`)
  }

  async function exportData() {
    const { data, error } = await supabase.from('memories').select('*').order('created_at')
    if (error) return setMsg({ ok: false, text: 'Could not export. Try again.' })
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'memora-export.json' })
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-lg space-y-8 px-4 py-6">
      <h1 className="font-display text-3xl">Account</h1>
      <dl className="rounded-lg border border-line bg-surface p-4 text-sm">
        <dt className="text-muted">Email</dt><dd className="mb-3">{session.user.email}</dd>
        <dt className="text-muted">Member since</dt><dd>{new Date(session.user.created_at).toLocaleDateString()}</dd>
      </dl>
      <form onSubmit={changePassword} className="space-y-3">
        <h2 className="font-medium">Change password</h2>
        <label className="block text-sm">New password
          <input className="field mt-1" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />
        </label>
        <button className="btn-primary">Update password</button>
      </form>
      <div className="space-y-3">
        <h2 className="font-medium">Your data</h2>
        <p className="text-sm text-muted">Download every memory as a JSON file.</p>
        <button className="btn" onClick={exportData}>Export memories</button>
      </div>
      <div className="space-y-3">
        <h2 className="font-medium">AI search by meaning</h2>
        <p className="text-sm text-muted">Lets Ask find memories by meaning, not only exact words. To build the index, each memory's title and first 2,000 characters are sent to the AI provider.</p>
        <button className="btn" disabled={indexing} onClick={reindex}>{indexing ? 'Indexing…' : 'Index my memories'}</button>
      </div>
      {msg && <p role="status" className={msg.ok ? 'text-sm text-accent' : 'text-sm text-danger'}>{msg.text}</p>}
      <button className="btn" onClick={onSignOut}>Sign out</button>
    </div>
  )
}
