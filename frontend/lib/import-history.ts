export type ImportModuleKey = 'subjects' | 'classes' | 'teachers' | 'students'

export interface ImportHistoryErrorRow {
  line: number
  message: string
  row?: Record<string, string>
}

export interface ImportHistoryItem {
  id: string
  module: ImportModuleKey
  fileName: string
  createdAt: string
  dryRun: boolean
  total: number
  success: number
  failed: number
  errors: ImportHistoryErrorRow[]
}

const keyFor = (module: ImportModuleKey) => `sios_import_history_${module}`

export const getImportHistory = (module: ImportModuleKey): ImportHistoryItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(keyFor(module))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const pushImportHistory = (module: ImportModuleKey, item: ImportHistoryItem) => {
  if (typeof window === 'undefined') return
  const current = getImportHistory(module)
  const next = [item, ...current].slice(0, 20)
  localStorage.setItem(keyFor(module), JSON.stringify(next))
}
