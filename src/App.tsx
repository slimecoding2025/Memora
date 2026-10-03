import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './Auth'
import Landing from './Landing'
import Shell from './Shell'
import Legal from './Legal'
import NotFound from './NotFound'

function useHash() {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    const f = () => setH(location.hash)
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const hash = useHash()
  const route = hash.startsWith('#/') ? hash.slice(1) : ''

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) return <p className="p-8 text-muted">Loading…</p>
  if (route === '/privacy' || route === '/terms') return <Legal kind={route === '/privacy' ? 'privacy' : 'terms'} />
  if (!(route === '' || route === '/' || route === '/login' || route.startsWith('/app'))) return <NotFound />
  if (session) return <Shell session={session} page={route.startsWith('/app/') ? route.slice(5) : ''} />
  return route === '/login' ? <Auth /> : <Landing />
}
