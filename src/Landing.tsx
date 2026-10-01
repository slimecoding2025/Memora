import { motion, useReducedMotion } from 'motion/react'

const CONTACT_EMAIL = 'bousminaselim@gmail.com' // change to your support address
const go = (h: string) => { location.hash = h }
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const NODES = [
  { x: 200, y: 150, r: 12, t: 'Python' }, { x: 90, y: 80, r: 8, t: 'Linux' }, { x: 310, y: 70, r: 9, t: 'Security' },
  { x: 330, y: 200, r: 7, t: 'Books' }, { x: 110, y: 220, r: 8, t: 'University' }, { x: 220, y: 40, r: 6, t: 'Ideas' },
  { x: 40, y: 160, r: 6, t: 'Travel' }, { x: 260, y: 250, r: 6, t: 'Goals' }
]
const EDGES = [[0, 1], [0, 2], [0, 4], [0, 3], [1, 4], [2, 5], [0, 5], [1, 6], [3, 7], [0, 7]]

function Universe() {
  const still = useReducedMotion()
  return (
    <svg viewBox="0 0 400 290" className="h-auto w-full" role="img" aria-label="A network of connected memories: Python, Linux, Security, Books and more">
      {EDGES.map(([a, b], i) => (
        <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke="var(--line)" strokeWidth="1.2" />
      ))}
      {NODES.map((n, i) => (
        <motion.g key={n.t} animate={still ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={i === 0 ? 'var(--accent)' : 'var(--raised)'} stroke="var(--accent)" strokeWidth="1.5" />
          <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" fontSize="11" fill="var(--muted)">{n.t}</text>
        </motion.g>
      ))}
    </svg>
  )
}

const STORY = [
  ['Capture in seconds', 'Type a title, paste a link, and save. A note, an idea, a quote or a bookmark takes the same few seconds, so nothing slips away while you are busy.'],
  ['Find it again', 'Search across titles, text and links as you type. Or ask in plain language, like “what did I save about Python?”, and get an answer built only from your own memories, with links back to them.'],
  ['See your life in order', 'The timeline groups what you saved into today, this week, this month and this year, so you can retrace what you were thinking and when.'],
  ['Private by design', 'Your memories belong to you. Every row is locked to your account at the database level, and AI answers only use memories your account can already read. AI is optional: if it is unavailable, everything else keeps working.']
]

export default function Landing() {
  return (
    <div>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-display text-2xl">MEMORA</span>
        <nav className="flex items-center gap-4 text-sm" aria-label="Site">
          <button className="hidden text-muted hover:text-ink sm:block" onClick={() => scrollTo('about')}>About</button>
          <button className="hidden text-muted hover:text-ink sm:block" onClick={() => scrollTo('contact')}>Contact</button>
          <button className="text-muted hover:text-ink" onClick={() => go('#/login')}>Sign in</button>
          <button className="btn-primary" onClick={() => go('#/login')}>Start for Free</button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
            <h1 className="font-display text-5xl leading-[1.05] md:text-6xl">Remember everything that matters.</h1>
            <p className="mt-5 max-w-md text-lg text-muted">Your ideas, notes, links, knowledge and memories — organized in one private space.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => go('#/login')}>Start for Free</button>
              <button className="btn" onClick={() => scrollTo('story')}>Explore MEMORA</button>
            </div>
          </motion.div>
          <Universe />
        </section>

        <section id="story" className="mx-auto max-w-3xl space-y-14 px-5 py-16">
          {STORY.map(([h, p]) => (
            <div key={h} className="border-l-2 border-accent pl-6">
              <h2 className="font-display text-3xl">{h}</h2>
              <p className="mt-3 max-w-xl leading-relaxed text-muted">{p}</p>
            </div>
          ))}
        </section>

        <section id="about" className="border-t border-line">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 className="font-display text-3xl">About MEMORA</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">Good ideas rarely arrive when it is convenient. MEMORA exists so you can capture something in seconds, forget about it, and come back months later to find it instantly and remember why it mattered. It is free, it is private, and it is built to stay out of your way.</p>
          </div>
        </section>

        <section id="contact" className="border-t border-line">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 className="font-display text-3xl">Contact</h2>
            <p className="mt-4 text-muted">Questions, bugs or ideas? Write to us and we will reply by email.</p>
            <a className="btn-primary mt-5 inline-block" href={`mailto:${CONTACT_EMAIL}?subject=MEMORA`}>Email us</a>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <h2 className="font-display text-4xl">Never lose an idea.</h2>
            <button className="btn-primary mt-6" onClick={() => go('#/login')}>Start for Free</button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
          <span>MEMORA — Never lose an idea. Never forget what matters.</span>
          <span>© {new Date().getFullYear()} MEMORA</span>
        </div>
      </footer>
    </div>
  )
}
