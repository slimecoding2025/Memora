import { useEffect, useState } from 'react'

export interface Note { id: string; text: string; at: number; read: boolean }
const KEY = 'memora:notes'
const listeners = new Set<() => void>()
const read = (): Note[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Note[] } catch { return [] } }
const save = (n: Note[]) => { localStorage.setItem(KEY, JSON.stringify(n.slice(0, 30))); listeners.forEach(l => l()) }

export function notify(text: string) {
  save([{ id: crypto.randomUUID(), text, at: Date.now(), read: false }, ...read()])
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification('MEMORA', { body: text })
}
export const markAllRead = () => save(read().map(n => ({ ...n, read: true })))
export const clearNotes = () => save([])
export async function askPermission() { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission() }
export function useNotes() {
  const [n, setN] = useState(read)
  useEffect(() => { const l = () => setN(read()); listeners.add(l); return () => { listeners.delete(l) } }, [])
  return n
}
