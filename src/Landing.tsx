import { motion, useScroll, useSpring } from 'motion/react'
import Hero3D from './Hero3D'
import Preview from './Preview'
import { CONTACT_EMAIL } from './config'

const go = (h: string) => { location.hash = h }
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })


const STORY = [
  ['Capture in seconds', 'Type a title, paste a link, and save. A note, an idea, a quote or a bookmark takes the same few seconds, so nothing slips away while you are busy.'],
  ['Find it again', 'Search across titles, text, tags and links as you type, then narrow by collection or tag to get straight back to what you saved.'],
  ['See your life in order', 'The timeline groups what you saved into today, this week, this month and this year, so you can retrace what you were thinking and when.'],
  ['Works offline', 'Lost your connection on a train? Keep capturing. Memories you save offline wait on your device and sync automatically when you are back online. Until then they exist only in that browser, and MEMORA clearly marks them as not yet synced. Install MEMORA from your browser to open it like an app.'],
  ['Private by design', 'Your memories belong to you. Every row is locked to your account at the database level, and nothing you save is sent to any AI service.']
]

export default function Landing() {
  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <div>
      <motion.div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent" style={{ scaleX: bar }} />
      <a href="#" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-bg" onClick={e => { e.preventDefault(); scrollTo('story') }}>Skip to content</a>
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
            <h1 aria-label="Remember everything that matters." className="font-display text-5xl leading-[1.05] md:text-6xl" style={{ perspective: 600 }}>
              {'Remember everything that matters.'.split(' ').map((w, i) => (
                <motion.span key={i} aria-hidden className="mr-[0.25em] inline-block" initial={{ opacity: 0, y: 28, rotateX: -50 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 16, delay: 0.09 * i }}>{w}</motion.span>
              ))}
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">Your ideas, notes, links, knowledge and memories — organized in one private space.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => go('#/login')}>Start for Free</button>
              <button className="btn" onClick={() => scrollTo('story')}>Explore MEMORA</button>
            </div>
          </motion.div>
          <Hero3D />
        </section>

        <Preview />

        <section id="story" className="mx-auto max-w-3xl space-y-14 px-5 py-16">
          {STORY.map(([h, p]) => (
            <motion.div key={h} className="border-l-2 border-accent pl-6" initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
              <h2 className="font-display text-3xl">{h}</h2>
              <p className="mt-3 max-w-xl leading-relaxed text-muted">{p}</p>
            </motion.div>
          ))}
        </section>

        <section className="border-t border-line" aria-label="Use cases">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 className="font-display text-3xl">Made for the way you learn and work</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {[['Students', 'Lecture notes, readings and exam ideas, grouped by course.'], ['Developers', 'Snippets, docs and the article you will want again next month.'], ['Researchers', 'Sources and quotes, tagged so connections surface later.'], ['Everyone else', 'Trips, books, goals and the thought you had in the shower.']].map(([k, v]) => (
                <div key={k}><dt className="font-medium text-accent">{k}</dt><dd className="mt-1 text-sm text-muted">{v}</dd></div>
              ))}
            </dl>
          </div>
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
          <span className="flex gap-4"><a className="underline" href="#/privacy">Privacy</a><a className="underline" href="#/terms">Terms</a><span>© {new Date().getFullYear()} MEMORA</span></span>
        </div>
      </footer>
    </div>
  )
}
