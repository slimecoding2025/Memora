import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BookOpen, Clock, Folder, Network, Search, LogOut, Moon, Sun, User } from 'lucide-react'
import Workspace from './Workspace'
import Timeline from './Timeline'
import Graph from './Graph'
import CommandPalette from './CommandPalette'
import Collections from './Collections'
import Account from './Account'
import { supabase } from './lib/supabase'

const NAV = [
  { id: '', label: 'Memories', icon: BookOpen },
  { id: 'collections', label: 'Collections', icon: Folder },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'account', label: 'Account', icon: User }
]

export default function Shell({ session, page }: { session: Session; page: string }) {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme)
  const [online, setOnline] = useState(navigator.onLine)
  const [palette, setPalette] = useState(false)
  const current = NAV.some(n => n.id === page) ? page : ''

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next; localStorage.setItem('theme', next); setTheme(next)
  }
  async function signOut() { await supabase.auth.signOut(); location.hash = '' }

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line p-4 md:flex">
        <a href="#/app" className="font-display text-2xl">MEMORA</a>
        <button className="btn mt-6 flex w-full items-center justify-between text-muted" onClick={() => setPalette(true)}><span className="flex items-center gap-2"><Search size={14} />Search</span><kbd className="text-xs">Ctrl K</kbd></button>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Main">
          {NAV.map(n => (
            <a key={n.id} href={`#/app/${n.id}`} aria-current={current === n.id ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-raised ${current === n.id ? 'bg-raised text-accent' : 'text-muted'}`}>
              <n.icon size={16} />{n.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          {!online && <p role="status" className="text-xs text-accent">You are offline</p>}
          <div className="flex gap-2">
            <button className="btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="btn flex items-center gap-1" onClick={signOut}><LogOut size={16} />Sign out</button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-8">
        <div className="flex items-center justify-between px-4 pt-4 md:hidden">
          <span className="font-display text-xl">MEMORA</span>
          <div className="flex items-center gap-2">
            <button className="btn" aria-label="Search" onClick={() => setPalette(true)}><Search size={16} /></button>
            {!online && <span role="status" className="text-xs text-accent">Offline</span>}
            <button className="btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </div>
        {current === '' && <Workspace key={location.hash} session={session} />}
        {current === 'collections' && <Collections />}
        {current === 'timeline' && <Timeline />}
        {current === 'graph' && <Graph />}
        {current === 'account' && <Account session={session} onSignOut={signOut} />}
      </main>

      <CommandPalette open={palette} setOpen={setPalette} />

      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-line bg-bg md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Main">
        {NAV.map(n => (
          <a key={n.id} href={`#/app/${n.id}`} aria-current={current === n.id ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-3 text-xs ${current === n.id ? 'text-accent' : 'text-muted'}`}>
            <n.icon size={20} />{n.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
