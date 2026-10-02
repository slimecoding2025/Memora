import { useState } from 'react'
import { Bell as BellIcon } from 'lucide-react'
import { askPermission, clearNotes, markAllRead, useNotes } from './lib/notify'

export default function Bell({ up = false }: { up?: boolean }) {
  const notes = useNotes()
  const [open, setOpen] = useState(false)
  const unread = notes.filter(n => !n.read).length
  return (
    <div className="relative" onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
      <button className="btn relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        onClick={() => { setOpen(!open); if (!open) markAllRead() }}>
        <BellIcon size={16} />
        {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[10px] font-semibold text-bg">{unread}</span>}
      </button>
      {open && (
        <div role="region" aria-label="Notifications" className={`absolute z-40 w-72 rounded-lg border border-line bg-surface p-3 shadow-xl ${up ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2'}`}>
          {notes.length === 0 ? <p className="text-sm text-muted">No notifications yet.</p> : (
            <ul className="max-h-64 space-y-2 overflow-auto text-sm">
              {notes.map(n => <li key={n.id}>{n.text}<span className="block text-xs text-muted">{new Date(n.at).toLocaleString()}</span></li>)}
            </ul>
          )}
          <div className="mt-3 flex gap-2 text-xs">
            <button className="btn" onClick={clearNotes}>Clear</button>
            <button className="btn" onClick={() => void askPermission()}>Enable browser alerts</button>
          </div>
        </div>
      )}
    </div>
  )
}
