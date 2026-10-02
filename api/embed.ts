import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  if (!token) return res.status(401).json({ error: 'Please sign in again.' })
  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false }
  })
  const { data: auth } = await sb.auth.getUser(token)
  if (!auth.user) return res.status(401).json({ error: 'Please sign in again.' })

  const since = new Date(Date.now() - 60_000).toISOString()
  const { count } = await sb.from('ai_generations').select('id', { count: 'exact', head: true }).eq('feature', 'embed').gte('created_at', since)
  if ((count ?? 0) >= 20) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })

  const { data: todo } = await sb.from('memories').select('id,title,content').is('embedding', null).limit(10)
  const rows = todo ?? []
  if (rows.length === 0) return res.json({ done: 0, remaining: 0 })
  try {
    const r = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-small',
        input: rows.map(m => `${m.title}\n${(m.content ?? '').slice(0, 2000)}`) // minimum necessary text
      })
    })
    if (!r.ok) throw new Error(`upstream ${r.status}`)
    const data = await r.json()
    await Promise.all(rows.map((m, i) => sb.from('memories').update({ embedding: JSON.stringify(data.data[i].embedding) }).eq('id', m.id)))
    await sb.from('ai_generations').insert({ feature: 'embed', status: 'ok', prompt_tokens: data.usage?.prompt_tokens })
    const { count: left } = await sb.from('memories').select('id', { count: 'exact', head: true }).is('embedding', null)
    return res.json({ done: rows.length, remaining: left ?? 0 })
  } catch (err) {
    console.error('embed failed:', err instanceof Error ? err.message : 'unknown') // status only, never user content
    await sb.from('ai_generations').insert({ feature: 'embed', status: 'error' })
    return res.status(503).json({ error: 'AI is temporarily unavailable. Your memories are safe.' })
  }
}
