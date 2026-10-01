import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { supabase } from './lib/supabase'

const MAX = 10 * 1024 * 1024
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const bucket = () => supabase.storage.from('attachments')

export default function Files({ userId, memoryId }: { userId: string; memoryId: string }) {
  const dir = `${userId}/${memoryId}`
  const [files, setFiles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
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
    setBusy(true)
    const safe = file.name.replace(/[^\w.-]+/g, '_').slice(-80)
    const { error } = await bucket().upload(`${dir}/${Date.now()}-${safe}`, file, { upsert: false })
    setBusy(false)
    if (error) setErr('Upload failed. Check your connection and try again.')
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
        {busy ? 'Uploading…' : 'Attach a file'}
        <input type="file" className="sr-only" onChange={upload} disabled={busy} accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.docx" />
      </label>
      <span className="ml-2 text-xs text-muted">Private. Up to 10 MB.</span>
      {err && <p role="alert" className="mt-2 text-red-400">{err}</p>}
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
