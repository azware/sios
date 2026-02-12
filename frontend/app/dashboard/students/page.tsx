'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'
import { downloadCsv, parseCsv, toCsv } from '@/lib/csv'
import { runWithConcurrency } from '@/lib/batch'
import { getImportHistory, ImportHistoryErrorRow, ImportHistoryItem, pushImportHistory } from '@/lib/import-history'

interface Student {
  id: number
  nis: string
  nisn: string
  name: string
  email: string
  classId?: number
  schoolId?: number
  class?: { name: string }
}

interface ImportErrorRow {
  line: number
  message: string
  row?: Record<string, string>
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [dryRunMode, setDryRunMode] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'nis' | 'nisn' | 'email' | 'class'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([])
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])
  const [lastFailedRows, setLastFailedRows] = useState<Array<{ line: number; row: Record<string, string> }>>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const user = authService.getCurrentUser()
  const isAdmin = user?.role === 'ADMIN'

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/students')
      setStudents(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Gagal memuat data siswa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    setImportHistory(getImportHistory('students'))
  }, [])

  const saveImportHistory = (fileName: string, dryRun: boolean, total: number, successCount: number, failures: ImportErrorRow[]) => {
    const errors: ImportHistoryErrorRow[] = failures.map((item) => ({ line: item.line, message: item.message }))
    pushImportHistory('students', {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      module: 'students',
      fileName,
      createdAt: new Date().toISOString(),
      dryRun,
      total,
      success: successCount,
      failed: failures.length,
      errors,
    })
    setImportHistory(getImportHistory('students'))
  }

  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortKey, sortDir])

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus data siswa ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    setSuccess('')
    try {
      await apiClient.delete(`/students/${id}`)
      setStudents((prev) => prev.filter((student) => student.id !== id))
      setSuccess('Siswa berhasil dihapus.')
    } catch (err) {
      console.error('Error deleting student:', err)
      setError('Gagal menghapus siswa.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.includes(searchTerm) ||
      student.nisn.includes(searchTerm)
  )

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const getValue = (student: Student) => {
      switch (sortKey) {
        case 'nis':
          return student.nis
        case 'nisn':
          return student.nisn
        case 'email':
          return student.email
        case 'class':
          return student.class?.name || ''
        case 'name':
        default:
          return student.name
      }
    }
    const aValue = getValue(a).toLowerCase()
    const bValue = getValue(b).toLowerCase()
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedStudents = sortedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const handleExportCsv = () => {
    const headers = ['nis', 'nisn', 'name', 'email', 'classId', 'schoolId']
    const rows = sortedStudents.map((item) => [
      item.nis,
      item.nisn,
      item.name,
      item.email,
      String(item.classId || ''),
      String(item.schoolId || ''),
    ])
    const csv = toCsv(headers, rows)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
    downloadCsv(`students_${stamp}.csv`, csv)
  }

  const handleDownloadTemplate = () => {
    const headers = ['nis', 'nisn', 'name', 'email', 'classId', 'schoolId', 'username', 'password', 'phone', 'gender', 'address']
    const rows = [['NIS001', 'NISN001', 'Ani Wijaya', 'siswa1@sios.local', '1', '1', 'siswa_ani', 'Admin123!', '08123456780', 'FEMALE', 'Alamat contoh']]
    const csv = toCsv(headers, rows)
    downloadCsv('students_template.csv', csv)
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
        setError('CSV kosong/tidak valid. Header wajib: nis,nisn,name,email,classId,schoolId,username,password')
        return
      }

      if (dryRunMode) {
        let valid = 0
        let invalid = 0
        const seenNis = new Set<string>()
        const seenNisn = new Set<string>()
        const seenUsername = new Set<string>()
        const failures: ImportErrorRow[] = []

        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i]
          const nis = (row.nis || '').trim()
          const nisn = (row.nisn || '').trim()
          const name = (row.name || '').trim()
          const email = (row.email || '').trim()
          const classId = Number((row.classid || row.classId || '').trim())
          const schoolId = Number((row.schoolid || row.schoolId || '').trim())
          const username = (row.username || '').trim()
          const password = (row.password || '').trim()

          if (!nis || !nisn || !name || !email || !email.includes('@') || !Number.isFinite(classId) || !Number.isFinite(schoolId) || !username || !password) {
            invalid += 1
            failures.push({ line: i + 2, message: 'field wajib tidak valid', row: row })
            continue
          }
          if (seenNis.has(nis)) {
            invalid += 1
            failures.push({ line: i + 2, message: `duplikat NIS di file (${nis})`, row: row })
            continue
          }
          if (seenNisn.has(nisn)) {
            invalid += 1
            failures.push({ line: i + 2, message: `duplikat NISN di file (${nisn})`, row: row })
            continue
          }
          if (seenUsername.has(username)) {
            invalid += 1
            failures.push({ line: i + 2, message: `duplikat username di file (${username})`, row: row })
            continue
          }

          seenNis.add(nis)
          seenNisn.add(nisn)
          seenUsername.add(username)
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
          const classId = Number((entry.row.classid || entry.row.classId || '').trim())
          const schoolId = Number((entry.row.schoolid || entry.row.schoolId || '').trim())
          const username = (entry.row.username || '').trim()
          const password = (entry.row.password || '').trim()
          const email = (entry.row.email || '').trim()

          const payload = {
            nis: (entry.row.nis || '').trim(),
            nisn: (entry.row.nisn || '').trim(),
            name: (entry.row.name || '').trim(),
            email,
            phone: (entry.row.phone || '').trim() || undefined,
            gender: (entry.row.gender || '').trim() || undefined,
            address: (entry.row.address || '').trim() || undefined,
            classId,
            schoolId,
          }

          if (!payload.nis || !payload.nisn || !payload.name || !payload.email || !Number.isFinite(classId) || !Number.isFinite(schoolId) || !username || !password) {
            return { ok: false, line: entry.line, message: 'data tidak lengkap', row: entry.row }
          }

          try {
            const reg = await apiClient.post('/auth/register', {
              username,
              email,
              password,
              role: 'STUDENT',
            })

            const userId = reg?.data?.id
            if (!userId) {
              throw new Error('register_user_failed')
            }

            await apiClient.post('/students', { ...payload, userId })
            return { ok: true, line: entry.line, message: '', row: entry.row }
          } catch (err: any) {
            const reason = err?.response?.data?.error || err?.message || 'error'
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

      await fetchStudents()
      setImportErrors(failures)
      setLastFailedRows(failures.filter((item) => item.row).map((item) => ({ line: item.line, row: item.row as Record<string, string> })))
      saveImportHistory(file.name, false, results.length, created, failures)
      setSuccess(`Import siswa selesai. Berhasil: ${created}, gagal: ${failed}.`)
      if (failures.length > 0) setError(failures.slice(0, 10).map((item) => `Baris ${item.line}: ${item.message}`).join(' | '))
    } catch (err) {
      console.error('Import student CSV failed:', err)
      setError('Gagal membaca file CSV siswa.')
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
    downloadCsv(`students_import_errors_${stamp}.csv`, csv)
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
          const classId = Number((entry.row.classid || entry.row.classId || '').trim())
          const schoolId = Number((entry.row.schoolid || entry.row.schoolId || '').trim())
          const username = (entry.row.username || '').trim()
          const password = (entry.row.password || '').trim()
          const email = (entry.row.email || '').trim()
          const payload = {
            nis: (entry.row.nis || '').trim(),
            nisn: (entry.row.nisn || '').trim(),
            name: (entry.row.name || '').trim(),
            email,
            phone: (entry.row.phone || '').trim() || undefined,
            gender: (entry.row.gender || '').trim() || undefined,
            address: (entry.row.address || '').trim() || undefined,
            classId,
            schoolId,
          }
          if (!payload.nis || !payload.nisn || !payload.name || !payload.email || !Number.isFinite(classId) || !Number.isFinite(schoolId) || !username || !password) {
            return { ok: false, line: entry.line, message: 'data tidak lengkap', row: entry.row }
          }
          try {
            const reg = await apiClient.post('/auth/register', {
              username,
              email,
              password,
              role: 'STUDENT',
            })
            const userId = reg?.data?.id
            if (!userId) throw new Error('register_user_failed')
            await apiClient.post('/students', { ...payload, userId })
            return { ok: true, line: entry.line, message: '', row: entry.row }
          } catch (err: any) {
            const reason = err?.response?.data?.error || err?.message || 'error'
            return { ok: false, line: entry.line, message: reason, row: entry.row }
          }
        },
        5
      )
      const failures: ImportErrorRow[] = results.filter((r) => !r.ok).map((r) => ({ line: r.line, message: r.message, row: r.row }))
      const created = results.length - failures.length
      await fetchStudents()
      setImportErrors(failures)
      setLastFailedRows(failures.filter((item) => item.row).map((item) => ({ line: item.line, row: item.row as Record<string, string> })))
      saveImportHistory('retry_failed_rows', false, results.length, created, failures)
      setSuccess(`Retry selesai. Berhasil: ${created}, gagal: ${failures.length}.`)
      if (failures.length > 0) setError(failures.slice(0, 10).map((item) => `Baris ${item.line}: ${item.message}`).join(' | '))
    } catch (err) {
      console.error('Retry student failed rows error:', err)
      setError('Gagal menjalankan retry baris gagal.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Siswa</h1>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleDownloadTemplate}>
            Template CSV
          </button>
          <button className="btn-secondary" onClick={handleExportCsv} disabled={loading || sortedStudents.length === 0}>
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
              <Link href="/dashboard/students/new" className="btn-primary">
                + Tambah Siswa
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN..."
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
          <button className="btn-secondary" onClick={() => handleSort('nis')}>
            NIS {sortKey === 'nis' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button className="btn-secondary" onClick={() => handleSort('nisn')}>
            NISN {sortKey === 'nisn' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button className="btn-secondary" onClick={() => handleSort('email')}>
            Email {sortKey === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button className="btn-secondary" onClick={() => handleSort('class')}>
            Kelas {sortKey === 'class' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
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
          <p className="text-gray-600">Memuat data siswa...</p>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Tidak ada siswa ditemukan</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">NIS</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">NISN</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kelas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudents.map((student, index) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{(currentPage - 1) * pageSize + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.nis}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.nisn}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.class?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/students/${student.id}/detail`} className="text-gray-600 hover:text-gray-800">
                        Detail
                      </Link>
                      {isAdmin && (
                        <>
                          <Link href={`/dashboard/students/${student.id}`} className="text-blue-600 hover:text-blue-800">
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            onClick={() => handleDelete(student.id)}
                            disabled={deletingId === student.id}
                          >
                            {deletingId === student.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Menampilkan {pagedStudents.length} dari {sortedStudents.length} siswa (Total: {students.length})
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
