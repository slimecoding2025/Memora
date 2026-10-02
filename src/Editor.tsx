import { useRef, useState } from 'react'
import { Bold, Code, Eye, Heading, Italic, Link2, List } from 'lucide-react'
import Markdown from './Markdown'

export default function Editor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ta = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  function wrap(before: string, after = before, placeholder = 'text') {
    const el = ta.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd, sel = value.slice(s, e) || placeholder
    onChange(value.slice(0, s) + before + sel + after + value.slice(e))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length) })
  }
  function prefix(p: string) {
    const el = ta.current
    if (!el) return
    const s = value.lastIndexOf('\n', el.selectionStart - 1) + 1
    onChange(value.slice(0, s) + p + value.slice(s))
    requestAnimationFrame(() => el.focus())
  }
  const tools = [
    ['Bold', Bold, () => wrap('**')], ['Italic', Italic, () => wrap('*')], ['Code', Code, () => wrap('`')],
    ['Heading', Heading, () => prefix('# ')], ['List', List, () => prefix('- ')], ['Link', Link2, () => wrap('[', '](https://)', 'link text')]
  ] as const

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-1" role="toolbar" aria-label="Formatting">
        {tools.map(([label, Icon, run]) => (
          <button key={label} type="button" className="btn px-2" aria-label={label} disabled={preview} onClick={run}><Icon size={14} /></button>
        ))}
        <button type="button" className="btn ml-auto flex items-center gap-1 px-2" aria-pressed={preview} onClick={() => setPreview(!preview)}><Eye size={14} />Preview</button>
      </div>
      {preview
        ? <div className="field min-h-24"><Markdown text={value || 'Nothing to preview yet.'} /></div>
        : <textarea ref={ta} className="field min-h-24" placeholder="Details (optional)" aria-label="Content" value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  )
}
