import { describe, expect, it } from 'vitest'
import { NewMemory, parseTags } from './validation'

describe('parseTags', () => {
  it('lowercases, strips #, and removes duplicates', () => {
    expect(parseTags('Python, #python, Security')).toEqual(['python', 'security'])
  })
  it('ignores empty and overlong tags', () => {
    expect(parseTags(' , ' + 'a'.repeat(41) + ', ok')).toEqual(['ok'])
  })
  it('keeps at most 10 tags', () => {
    expect(parseTags(Array.from({ length: 15 }, (_, i) => `t${i}`).join(','))).toHaveLength(10)
  })
})

describe('NewMemory', () => {
  const ok = { title: 'Hello', content: '', type: 'note', source_url: null }
  it('accepts a valid memory', () => expect(NewMemory.safeParse(ok).success).toBe(true))
  it('rejects an empty title', () => expect(NewMemory.safeParse({ ...ok, title: '  ' }).success).toBe(false))
  it('rejects an invalid URL', () => expect(NewMemory.safeParse({ ...ok, source_url: 'nope' }).success).toBe(false))
  it('rejects an unknown type', () => expect(NewMemory.safeParse({ ...ok, type: 'x' }).success).toBe(false))
  it('rejects content over 20000 characters', () => expect(NewMemory.safeParse({ ...ok, content: 'a'.repeat(20001) }).success).toBe(false))
})
