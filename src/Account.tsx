import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

export default function Account({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 8) return setMsg({ ok: false, text: 'Use at least 8 characters.' })
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setMsg({ ok: false, text: 'Could not change the password. Sign in again and retry.' })
    else { setMsg({ ok: true, text: 'Password updated.' }); setPw('') }
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
        <p className="text-sm text-muted">Memories saved while offline stay only in this browser until they sync. Clearing your browser data before then deletes them.</p>
        <button className="btn" onClick={exportData}>Export memories</button>
      </div>
      {msg && <p role="status" className={msg.ok ? 'text-sm text-accent' : 'text-sm text-danger'}>{msg.text}</p>}
      <button className="btn" onClick={onSignOut}>Sign out</button>
    </div>
  )
}
