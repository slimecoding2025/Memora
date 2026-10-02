import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { supabase } from './lib/supabase'

export const MAX = 10 * 1024 * 1024
export const ALLOWED = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const bucket = () => supabase.storage.from('attachments')

export function send(path: string, file: File, token: string, onPct: (n: number) => void): Promise<boolean> {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest()
    const enc = path.split('/').map(encodeURIComponent).join('/')
    xhr.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/attachments/${enc}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY as string)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
    xhr.onerror = () => resolve(false)
    xhr.send(file)
  })
}

export default function Files({ userId, memoryId }: { userId: string; memoryId: string }) {
  const dir = `${userId}/${memoryId}`
  const [files, setFiles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [pct, setPct] = useState<number | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await bucket().list(dir)
    if (error) setErr('Could not load files. Try again.')
    else setFiles((data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => f.name))
  }, [dir])
  useEffect(() => { void load() }, [load])

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr('')
    if (file.size > MAX) return setErr('That file is larger than 10 MB.')
    if (!ALLOWED.includes(file.type)) return setErr('Use an image, PDF, text or Word file.')
    setBusy(true); setPct(0)
    const safe = file.name.replace(/[^\w.-]+/g, '_').slice(-80)
    const { data: s } = await supabase.auth.getSession()
    const ok = s.session ? await send(`${dir}/${Date.now()}-${safe}`, file, s.session.access_token, setPct) : false
    setBusy(false); setPct(null)
    if (!ok) setErr('Upload failed. Check your connection and try again.')
    else void load()
  }
  async function open(name: string) {
    const { data, error } = await bucket().createSignedUrl(`${dir}/${name}`, 60)
    if (error || !data) return setErr('Could not open that file.')
    window.open(data.signedUrl, '_blank', 'noopener')
  }
  async function remove(name: string) {
    if (!confirm('Delete this file?')) return
    const { error } = await bucket().remove([`${dir}/${name}`])
    if (error) setErr('Could not delete that file.'); else void load()
  }

  return (
    <div className="mt-3 rounded-md border border-line bg-raised p-3 text-sm">
      <label className="btn inline-block cursor-pointer">
        {busy ? `Uploading ${pct ?? 0}%` : 'Attach a file'}
        <input type="file" className="sr-only" onChange={upload} disabled={busy} accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.docx,.webm,.m4a,.mp3" />
      </label>
      {pct !== null && <progress className="ml-2 inline-block h-2 w-32 align-middle" max={100} value={pct} aria-label="Upload progress" />}
      <span className="ml-2 text-xs text-muted">Private. Up to 10 MB.</span>
      {err && <p role="alert" className="mt-2 text-danger">{err}</p>}
      {files.length === 0 ? <p className="mt-2 text-muted">No files yet.</p> : (
        <ul className="mt-2 space-y-1">
          {files.map(n => (
            <li key={n} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">{n.replace(/^\d+-/, '')}</span>
              <span className="flex shrink-0 gap-1">
                <button className="btn" aria-label={`Open ${n}`} onClick={() => open(n)}><Download size={14} /></button>
                <button className="btn" aria-label={`Delete ${n}`} onClick={() => remove(n)}><Trash2 size={14} /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
