'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'
import { downloadCsv, parseCsv, toCsv } from '@/lib/csv'
import { runWithConcurrency } from '@/lib/batch'
import { getImportHistory, ImportHistoryErrorRow, ImportHistoryItem, pushImportHistory } from '@/lib/import-history'

interface Class {
  id: number
  name: string
  level: string
  schoolId?: number
  students?: Array<any>
}

interface ImportErrorRow {
  line: number
  message: string
  row?: Record<string, string>
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [dryRunMode, setDryRunMode] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'level'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([])
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])
  const [lastFailedRows, setLastFailedRows] = useState<Array<{ line: number; row: Record<string, string> }>>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const user = authService.getCurrentUser()
  const isAdmin = user?.role === 'ADMIN'

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes')
      setClasses(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError('Gagal memuat data kelas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
    setImportHistory(getImportHistory('classes'))
  }, [])

  const saveImportHistory = (fileName: string, dryRun: boolean, total: number, successCount: number, failures: ImportErrorRow[]) => {
    const errors: ImportHistoryErrorRow[] = failures.map((item) => ({ line: item.line, message: item.message }))
    pushImportHistory('classes', {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      module: 'classes',
      fileName,
      createdAt: new Date().toISOString(),
      dryRun,
      total,
      success: successCount,
      failed: failures.length,
      errors,
    })
    setImportHistory(getImportHistory('classes'))
  }

  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortKey, sortDir])

  const filteredClasses = classes.filter((kelas) => {
    const term = searchTerm.toLowerCase()
    return kelas.name.toLowerCase().includes(term) || kelas.level.toLowerCase().includes(term)
  })

  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const getValue = (kelas: Class) => (sortKey === 'level' ? kelas.level : kelas.name)
    const aValue = getValue(a).toLowerCase()
    const bValue = getValue(b).toLowerCase()
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedClasses.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedClasses = sortedClasses.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus data kelas ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    setSuccess('')
    try {
      await apiClient.delete(`/classes/${id}`)
      setClasses((prev) => prev.filter((kelas) => kelas.id !== id))
      setSuccess('Kelas berhasil dihapus.')
    } catch (err) {
      console.error('Error deleting class:', err)
      setError('Gagal menghapus kelas.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCsv = () => {
    const headers = ['name', 'level', 'schoolId']
    const rows = sortedClasses.map((item) => [item.name, item.level, String(item.schoolId || '')])
    const csv = toCsv(headers, rows)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
    downloadCsv(`classes_${stamp}.csv`, csv)
  }

  const handleDownloadTemplate = () => {
    const headers = ['name', 'level', 'schoolId']
    const rows = [['10A', '10', '1']]
    const csv = toCsv(headers, rows)
    downloadCsv('classes_template.csv', csv)
  }

  const handleImportClick = () => {
    setError('')
    setSuccess('')
    setImportErrors([])
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError('')
    setSuccess('')
    setImportErrors([])

    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setError('CSV kosong/tidak valid. Header wajib: name,level,schoolId')
        return
      }

      if (dryRunMode) {
        let valid = 0
        let invalid = 0
        const seenKeys = new Set<string>()
        const failures: ImportErrorRow[] = []

        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i]
          const name = (row.name || '').trim()
          const level = (row.level || '').trim()
          const schoolId = Number((row.schoolid || row.schoolId || '').trim())

          if (!name || !level || !Number.isFinite(schoolId)) {
            invalid += 1
            failures.push({ line: i + 2, message: 'name/level/schoolId tidak valid', row: row })
            continue
          }

          const uniqueKey = `${schoolId}:${name.toLowerCase()}`
          if (seenKeys.has(uniqueKey)) {
            invalid += 1
            failures.push({ line: i + 2, message: `duplikat kelas di file (${name})`, row: row })
            continue
          }

          seenKeys.add(uniqueKey)
          valid += 1
        }

        setSuccess(`Dry run selesai. Valid: ${valid}, invalid: ${invalid}. Tidak ada data disimpan.`)
        setImportErrors(failures)
        setLastFailedRows(failures.filter((item) => item.row).map((item) => ({ line: item.line, row: item.row as Record<string, string> })))
        saveImportHistory(file.name, true, rows.length, valid, failures)
        if (failures.length > 0) {
          setError(failures.slice(0, 10).map((item) => `Baris ${item.line}: ${item.message}`).join(' | '))
        }
        return
      }

      const entries = rows.map((row, index) => ({ row, line: index + 2 }))
      const results = await runWithConcurrency(
        entries,
        async (entry) => {
          const payload = {
            name: (entry.row.name || '').trim(),
            level: (entry.row.level || '').trim(),
            schoolId: Number((entry.row.schoolid || entry.row.schoolId || '').trim()),
          }

          if (!payload.name || !payload.level || !Number.isFinite(payload.schoolId)) {
            return { ok: false, line: entry.line, message: 'data tidak lengkap', row: entry.row }
          }

          try {
            await apiClient.post('/classes', payload)
            return { ok: true, line: entry.line, message: '', row: entry.row }
          } catch (err: any) {
            const reason = err?.response?.data?.error || 'error'
            return { ok: false, line: entry.line, message: reason, row: entry.row }
          }
        },
        5
      )

      const failures: ImportErrorRow[] = results
        .filter((result) => !result.ok)
        .map((result) => ({ line: result.line, message: result.message, row: result.row }))
      const created = results.length - failures.length
      const failed = failures.length

      await fetchClasses()
      setImportErrors(failures)
      setLastFailedRows(failures.filter((item) => item.row).map((item) => ({ line: item.line, row: item.row as Record<string, string> })))
      saveImportHistory(file.name, false, results.length, created, failures)
      setSuccess(`Import kelas selesai. Berhasil: ${created}, gagal: ${failed}.`)
      if (failures.length > 0) {
        setError(failures.slice(0, 10).map((item) => `Baris ${item.line}: ${item.message}`).join(' | '))
      }
    } catch (err) {
      console.error('Import class CSV failed:', err)
      setError('Gagal membaca file CSV kelas.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownloadErrorCsv = () => {
    if (importErrors.length === 0) return
    const headers = ['line', 'error']
    const rows = importErrors.map((item) => [String(item.line), item.message])
    const csv = toCsv(headers, rows)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
    downloadCsv(`classes_import_errors_${stamp}.csv`, csv)
  }

  const handleRetryFailedRows = async () => {
    if (lastFailedRows.length === 0) return
    setImporting(true)
    setError('')
    setSuccess('')
    setImportErrors([])

    try {
      const entries = lastFailedRows.map((entry) => ({ row: entry.row, line: entry.line }))
      const results = await runWithConcurrency(
        entries,
        async (entry) => {
          const payload = {
            name: (entry.row.name || '').trim(),
            level: (entry.row.level || '').trim(),
            schoolId: Number((entry.row.schoolid || entry.row.schoolId || '').trim()),
          }
          if (!payload.name || !payload.level || !Number.isFinite(payload.schoolId)) {
            return { ok: false, line: entry.line, message: 'data tidak lengkap', row: entry.row }
          }
          try {
            await apiClient.post('/classes', payload)
            return { ok: true, line: entry.line, message: '', row: entry.row }
          } catch (err: any) {
            const reason = err?.response?.data?.error || 'error'
            return { ok: false, line: entry.line, message: reason, row: entry.row }
          }
        },
        5
      )
      const failures: ImportErrorRow[] = results.filter((r) => !r.ok).map((r) => ({ line: r.line, message: r.message, row: r.row }))
      const created = results.length - failures.length
      await fetchClasses()
      setImportErrors(failures)
      setLastFailedRows(failures.filter((item) => item.row).map((item) => ({ line: item.line, row: item.row as Record<string, string> })))
      saveImportHistory('retry_failed_rows', false, results.length, created, failures)
      setSuccess(`Retry selesai. Berhasil: ${created}, gagal: ${failures.length}.`)
      if (failures.length > 0) setError(failures.slice(0, 10).map((item) => `Baris ${item.line}: ${item.message}`).join(' | '))
    } catch (err) {
      console.error('Retry class failed rows error:', err)
      setError('Gagal menjalankan retry baris gagal.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Kelas</h1>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleDownloadTemplate}>
            Template CSV
          </button>
          <button className="btn-secondary" onClick={handleExportCsv} disabled={loading || sortedClasses.length === 0}>
            Export CSV
          </button>
          {isAdmin && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={dryRunMode}
                  onChange={(e) => setDryRunMode(e.target.checked)}
                />
                Dry Run
              </label>
              <button className="btn-secondary" onClick={handleImportClick} disabled={importing}>
                {importing ? 'Import...' : 'Import CSV'}
              </button>
              <button className="btn-secondary" onClick={handleDownloadErrorCsv} disabled={importErrors.length === 0}>
                Error CSV
              </button>
              <button className="btn-secondary" onClick={handleRetryFailedRows} disabled={importing || lastFailedRows.length === 0}>
                Retry Gagal
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportFile}
              />
              <Link href="/dashboard/classes/new" className="btn-primary">
                + Tambah Kelas
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari nama kelas atau tingkat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field flex-1"
          />
          <button className="btn-primary" type="button">
            Cari
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>Urutkan:</span>
          <button className="btn-secondary" onClick={() => handleSort('name')}>
            Nama {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button className="btn-secondary" onClick={() => handleSort('level')}>
            Tingkat {sortKey === 'level' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <div className="flex items-center gap-2">
            <span>Per halaman</span>
            <select
              className="input-field"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={9}>9</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="card mb-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}
      <div className="card mb-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">Riwayat Import</p>
        {importHistory.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada riwayat import.</p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-700">
            {importHistory.slice(0, 5).map((item) => (
              <li key={item.id}>
                {new Date(item.createdAt).toLocaleString()} | {item.fileName} | ok: {item.success} gagal: {item.failed}
                {item.dryRun ? ' (dry-run)' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Memuat data kelas...</p>
        </div>
      ) : sortedClasses.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Tidak ada kelas ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedClasses.map((kelas) => (
            <div key={kelas.id} className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{kelas.name}</h3>
              <p className="text-gray-600 mb-4">Tingkat: {kelas.level}</p>
              <p className="text-gray-600 mb-4">Siswa: {kelas.students?.length || 0}</p>
              <div className="flex gap-2">
                <Link href={`/dashboard/classes/${kelas.id}/detail`} className="btn-secondary text-sm">
                  Detail
                </Link>
                {isAdmin && (
                  <>
                    <Link href={`/dashboard/classes/${kelas.id}`} className="btn-primary text-sm">
                      Edit
                    </Link>
                    <button
                      className="btn-secondary text-sm disabled:opacity-60"
                      onClick={() => handleDelete(kelas.id)}
                      disabled={deletingId === kelas.id}
                    >
                      {deletingId === kelas.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Menampilkan {pagedClasses.length} dari {sortedClasses.length} kelas (Total: {classes.length})
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button className="btn-secondary" disabled={currentPage === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Sebelumnya
        </button>
        <span className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          className="btn-secondary"
          disabled={currentPage === totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}
