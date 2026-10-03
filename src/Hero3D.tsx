import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

const CARDS = [
  { t: 'Python networking', tag: '#python', x: 4, y: 10, z: 90, d: 5.2 },
  { t: 'Lecture 4: processes', tag: '#university', x: 50, y: 2, z: 30, d: 6.1 },
  { t: 'What is a firewall', tag: '#security', x: 30, y: 38, z: 150, d: 4.6 },
  { t: 'Lisbon in spring', tag: '#travel', x: 2, y: 62, z: 20, d: 6.8 },
  { t: 'Book: Deep Work', tag: '#books', x: 52, y: 60, z: 80, d: 5.6 },
  { t: 'Finish the course', tag: '#goals', x: 26, y: 82, z: 120, d: 7.2 }
]
const LINKS = [[0, 2], [1, 2], [2, 4], [3, 0], [4, 5], [2, 5]]

/** Interactive 3D memory constellation: CSS 3D + spring-driven tilt that follows the pointer. */
export default function Hero3D() {
  const still = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0), my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 110, damping: 16 })
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), { stiffness: 110, damping: 16 })

  function move(e: React.PointerEvent) {
    if (still || !box.current) return
    const r = box.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5)
  }
  return (
    <div ref={box} className="relative h-[22rem] w-full touch-pan-y sm:h-[27rem]" style={{ perspective: 1100 }}
      onPointerMove={move} onPointerLeave={() => { mx.set(0); my.set(0) }} role="img"
      aria-label="Floating memory cards connected by lines: Python, university, security, travel, books and goals">
      <div className="pointer-events-none absolute inset-6 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }} />
      <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {LINKS.map(([a, b]) => (
            <motion.line key={`${a}${b}`} x1={CARDS[a].x + 14} y1={CARDS[a].y + 6} x2={CARDS[b].x + 14} y2={CARDS[b].y + 6}
              stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.6 }} />
          ))}
        </svg>
        {CARDS.map((c, i) => (
          <motion.div key={c.t} className="absolute w-36 rounded-lg border border-line bg-surface px-3 py-2 shadow-xl sm:w-44"
            style={{ left: `${c.x}%`, top: `${c.y}%`, z: c.z }}
            initial={{ opacity: 0, scale: 0.8 }} animate={still ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -9, 0] }}
            transition={{ opacity: { delay: 0.15 * i }, scale: { type: 'spring', stiffness: 140, damping: 16, delay: 0.15 * i }, y: { duration: c.d, repeat: Infinity, ease: 'easeInOut' } }}
            whileHover={{ scale: 1.08 }}>
            <p className="truncate text-sm font-medium">{c.t}</p>
            <p className="text-xs text-accent">{c.tag}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
