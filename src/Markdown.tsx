import type { ReactNode } from 'react'

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g

function inline(t: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0, k = 0
  for (const m of t.matchAll(INLINE)) {
    const i = m.index ?? 0, s = m[0]
    if (i > last) out.push(t.slice(last, i))
    if (s.startsWith('**')) out.push(<strong key={k++}>{s.slice(2, -2)}</strong>)
    else if (s.startsWith('`')) out.push(<code key={k++} className="rounded bg-raised px-1 font-mono text-xs">{s.slice(1, -1)}</code>)
    else if (s.startsWith('[')) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(s) as RegExpExecArray
      out.push(<a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">{label}</a>)
    } else out.push(<em key={k++}>{s.slice(1, -1)}</em>)
    last = i + s.length
  }
  if (last < t.length) out.push(t.slice(last))
  return out
}

/** Renders a safe Markdown subset as React elements (no raw HTML is ever injected). */
export default function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) { blocks.push(<ul key={blocks.length} className="ml-5 list-disc">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = [] }
  }
  for (const line of text.split('\n')) {
    const li = /^[-*] (.*)/.exec(line)
    if (li) { list.push(li[1]); continue }
    flush()
    const h = /^#{1,3} (.*)/.exec(line)
    if (h) blocks.push(<p key={blocks.length} className="font-medium text-ink">{inline(h[1])}</p>)
    else if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>)
  }
  flush()
  return <div className="space-y-1 break-words text-sm text-muted">{blocks}</div>
}
