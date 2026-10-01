import { z } from 'zod'

export const NewMemory = z.object({
  title: z.string().trim().min(1, 'Add a title.').max(200),
  content: z.string().max(20000),
  type: z.enum(['note', 'idea', 'link', 'quote']),
  source_url: z.string().url('Enter a valid URL.').max(2000).nullable()
})

export function parseTags(s: string): string[] {
  const names = s.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(t => t && t.length <= 40)
  return [...new Set(names)].slice(0, 10)
}
