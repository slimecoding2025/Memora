import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { z } from 'zod'
import { supabase } from './lib/supabase'

const Creds = z.object({ email: z.string().email('Enter a valid email.'), password: z.string().min(8, 'Use at least 8 characters.') })

export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    const parsed = mode === 'reset' ? z.string().email().safeParse(email) : Creds.safeParse({ email, password })
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0].message })
    setBusy(true)
    const err =
      mode === 'in' ? (await supabase.auth.signInWithPassword({ email, password })).error
      : mode === 'up' ? (await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } })).error
      : (await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin })).error
    setBusy(false)
    if (err) return setMsg({ ok: false, text: 'That did not work. Check your details and try again.' })
    if (mode === 'up') setMsg({ ok: true, text: 'Check your email to verify your account.' })
    if (mode === 'reset') setMsg({ ok: true, text: 'Password reset link sent.' })
  }

  return (
    <motion.main initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 140, damping: 20 }} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-4xl">MEMORA</h1>
      <p className="mb-8 mt-2 text-muted">Never lose an idea. Never forget what matters.</p>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <label className="block text-sm">Email
          <input className="field mt-1" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        {mode !== 'reset' && (
          <label className="block text-sm">Password
            <input className="field mt-1" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
          </label>
        )}
        {mode === 'up' && <p className="text-xs text-muted">By creating an account you agree to the <a className="underline" href="#/terms">Terms</a> and <a className="underline" href="#/privacy">Privacy Policy</a>.</p>}
        {msg && <p role="status" className={msg.ok ? 'text-sm text-accent' : 'text-sm text-danger'}>{msg.text}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-muted">
        <button onClick={() => setMode(mode === 'in' ? 'up' : 'in')} className="underline">{mode === 'in' ? 'Create an account' : 'Back to sign in'}</button>
        {mode === 'in' && <button onClick={() => setMode('reset')} className="underline">Forgot password?</button>}
      </div>
    </motion.main>
  )
}
