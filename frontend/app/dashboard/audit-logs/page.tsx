'use client'

import { useCallback, useEffect, useState } from 'react'
import apiClient from '@/lib/api'

interface AuditLogItem {
  id: number
  method: string
  path: string
  statusCode: number
  createdAt: string
  user?: {
    id: number
    username: string
    role: string
  } | null
}

interface AuditResponse {
  data: AuditLogItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const methodOptions = ['ALL', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [method, setMethod] = useState('ALL')
  const [pathQuery, setPathQuery] = useState('')
  const [appliedPath, setAppliedPath] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        page,
        pageSize: 20,
      }
      if (method !== 'ALL') params.method = method
      if (appliedPath.trim()) params.path = appliedPath.trim()

      const response = await apiClient.get<AuditResponse>('/audit-logs', { params })
      const payload = response.data
      setItems(Array.isArray(payload.data) ? payload.data : [])
      setTotalPages(payload.pagination?.totalPages || 1)
    } catch (err: any) {
      const status = err?.response?.status
      setError(status === 403 ? 'Akses ditolak. Hanya admin yang dapat melihat audit log.' : 'Gagal memuat audit log.')
      setItems([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [appliedPath, method, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [method, appliedPath])

  const handleSearch = () => {
    setAppliedPath(pathQuery)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Method</label>
            <select className="input-field w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
              {methodOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Path contains</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field w-full"
                placeholder="/api/students"
                value={pathQuery}
                onChange={(e) => setPathQuery(e.target.value)}
              />
              <button className="btn-primary" type="button" onClick={handleSearch}>
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-8">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-8">Belum ada audit log</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Waktu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Method</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Path</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.user ? `${item.user.username} (${item.user.role})` : 'system/anonymous'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{item.method}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.path}</td>
                  <td className="px-4 py-3 text-sm">{item.statusCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Sebelumnya
        </button>
        <span className="text-sm text-gray-600">
          Halaman {page} dari {Math.max(1, totalPages)}
        </span>
        <button
          className="btn-secondary"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}
