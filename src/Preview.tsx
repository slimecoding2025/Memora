import { useState } from 'react'

const DEMO = [
  { t: 'Python networking with sockets', c: 'Build a TCP client and server with the socket module, then try scapy.', tags: ['python', 'networking'], col: 'Programming' },
  { t: 'Operating systems, lecture 4', c: 'Processes vs threads, scheduling, and why context switches are costly.', tags: ['university', 'os'], col: 'University' },
  { t: 'What is a firewall', c: 'Filters traffic by rules on ports, addresses and protocols.', tags: ['security', 'networking'], col: 'Cybersecurity' },
  { t: 'Privacy-first notes app', c: 'Capture in seconds, rediscover months later.', tags: ['startup', 'privacy'], col: 'Ideas' },
  { t: 'Book: Deep Work', c: 'Schedule long blocks of focus. Silence notifications.', tags: ['books', 'focus'], col: 'Books' },
  { t: 'Lisbon in spring', c: 'Tram 28 early, pastéis de Belém, day trip to Sintra.', tags: ['travel'], col: 'Travel' },
  { t: 'Goal: finish the networking course', c: 'Two chapters per week, lab every Sunday.', tags: ['goals', 'networking'], col: 'Personal' }
]

export default function Preview() {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const term = q.trim().toLowerCase()
  const list = DEMO.filter(m =>
    (!tag || m.tags.includes(tag)) &&
    (!term || `${m.t} ${m.c} ${m.tags.join(' ')} ${m.col}`.toLowerCase().includes(term)))

  return (
    <section className="mx-auto max-w-3xl px-5 pb-6" aria-label="Product preview">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input className="field w-full sm:w-72" type="search" placeholder="Try it: search “networking”" aria-label="Search the demo" value={q} onChange={e => setQ(e.target.value)} />
          <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">Demo data, not real memories</span>
        </div>
        <ul className="mt-4 space-y-2" aria-live="polite">
          {list.map(m => (
            <li key={m.t} className="rounded-md border border-line bg-raised p-3">
              <p className="font-medium">{m.t}</p>
              <p className="text-xs text-muted">{m.col}</p>
              <p className="mt-1 text-sm text-muted">{m.c}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.tags.map(t => (
                  <button key={t} aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}
                    className={`rounded-full border px-2 py-0.5 text-xs ${tag === t ? 'border-accent text-accent' : 'border-line text-muted'}`}>#{t}</button>
                ))}
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-sm text-muted">Nothing matches. Clear the search to see the demo again.</li>}
        </ul>
      </div>
    </section>
  )
}
