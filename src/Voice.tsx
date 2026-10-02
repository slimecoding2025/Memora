import { useRef, useState } from 'react'

export default function Voice({ onFile }: { onFile: (f: File | null) => void }) {
  const rec = useRef<MediaRecorder | null>(null)
  const [on, setOn] = useState(false)
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')

  async function start() {
    setErr('')
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') return setErr('Voice recording is not supported in this browser.')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks: Blob[] = []
      const r = new MediaRecorder(stream)
      r.ondataavailable = e => chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const type = (r.mimeType || 'audio/webm').split(';')[0]
        const f = new File(chunks, `voice-note.${type.includes('mp4') ? 'm4a' : 'webm'}`, { type })
        onFile(f); setUrl(URL.createObjectURL(f))
      }
      r.start(); rec.current = r; setOn(true)
    } catch { setErr('Microphone access was denied.') }
  }
  function stop() { rec.current?.stop(); setOn(false) }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn" onClick={on ? stop : start} aria-pressed={on}>{on ? 'Stop recording' : url ? 'Record again' : 'Start recording'}</button>
      {on && <span role="status" className="text-sm text-accent">Recording…</span>}
      {url && !on && <audio controls src={url} className="h-9" />}
      {err && <p role="alert" className="w-full text-sm text-danger">{err}</p>}
    </div>
  )
}
