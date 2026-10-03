import { useEffect, useState } from 'react'
import { pending, type Draft } from './offline'

/** Memories saved on this device that have not reached the account yet. */
export function usePending(): Draft[] {
  const [items, setItems] = useState<Draft[]>(pending)
  useEffect(() => {
    const f = () => setItems(pending())
    window.addEventListener('memora-queue', f)
    window.addEventListener('storage', f)
    return () => { window.removeEventListener('memora-queue', f); window.removeEventListener('storage', f) }
  }, [])
  return items
}
