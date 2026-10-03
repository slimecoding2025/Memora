import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Session } from '@supabase/supabase-js'
import { BookOpen, Clock, Folder, Network, Search, LogOut, Moon, Sun, User } from 'lucide-react'
import Workspace from './Workspace'
import Timeline from './Timeline'
import Graph from './Graph'
import CommandPalette from './CommandPalette'
import Bell from './Bell'
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
      <a href="#" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-bg" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line p-4 md:flex">
        <a href="#/app" className="font-display text-2xl">MEMORA</a>
        <button className="btn mt-6 flex w-full items-center justify-between text-muted" onClick={() => setPalette(true)}><span className="flex items-center gap-2"><Search size={14} />Search</span><kbd className="text-xs">Ctrl K</kbd></button>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Main">
          {NAV.map(n => (
            <a key={n.id} href={`#/app/${n.id}`} aria-current={current === n.id ? 'page' : undefined}
              className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:text-ink ${current === n.id ? 'text-accent' : 'text-muted'}`}>
              {current === n.id && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-md bg-raised" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative z-10 flex items-center gap-2"><n.icon size={16} />{n.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          {!online && <p role="status" className="text-xs text-accent">You are offline</p>}
          <div className="flex flex-wrap gap-2">
            <Bell up />
            <button className="btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="btn flex items-center gap-1 whitespace-nowrap" onClick={signOut}><LogOut size={16} />Sign out</button>
          </div>
        </div>
      </aside>

      <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-24 focus:outline-none md:pb-8">
        <div className="flex items-center justify-between px-4 pt-4 md:hidden">
          <span className="font-display text-xl">MEMORA</span>
          <div className="flex items-center gap-2">
            <Bell />
            <button className="btn" aria-label="Search" onClick={() => setPalette(true)}><Search size={16} /></button>
            {!online && <span role="status" className="text-xs text-accent">Offline</span>}
            <button className="btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 400, damping: 34 }}>
            {current === '' && <Workspace key={location.hash} session={session} />}
        {current === 'collections' && <Collections />}
        {current === 'timeline' && <Timeline />}
        {current === 'graph' && <Graph />}
        {current === 'account' && <Account session={session} onSignOut={signOut} />}
          </motion.div>
        </AnimatePresence>
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
