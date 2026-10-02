export type MemoryType = 'note' | 'idea' | 'link' | 'quote' | 'image' | 'document' | 'voice'
export interface Memory {
  id: string; title: string; content: string; type: MemoryType; source_url: string | null
  is_favorite: boolean; is_archived: boolean; created_at: string
  collection_id?: string | null
  version?: number
  collections?: { name: string } | null
  memory_tags?: { tags: { id: string; name: string } | null }[]
}
