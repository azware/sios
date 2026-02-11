'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'
import { downloadCsv, parseCsv, toCsv } from '@/lib/csv'

interface Subject {
  id: number
  code: string
  name: string
  description?: string
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'code' | 'name'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const user = authService.getCurrentUser()
  const isAdmin = user?.role === 'ADMIN'

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get('/subjects')
      setSubjects(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error fetching subjects:', err)
      setError('Gagal memuat data mata pelajaran.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortKey, sortDir])

  const filteredSubjects = subjects.filter((subject) => {
    const term = searchTerm.toLowerCase()
    return subject.code.toLowerCase().includes(term) || subject.name.toLowerCase().includes(term)
  })

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    const getValue = (subject: Subject) => (sortKey === 'code' ? subject.code : subject.name)
    const aValue = getValue(a).toLowerCase()
    const bValue = getValue(b).toLowerCase()
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedSubjects.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedSubjects = sortedSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus mata pelajaran ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    setSuccess('')
    try {
      await apiClient.delete(`/subjects/${id}`)
      setSubjects((prev) => prev.filter((subject) => subject.id !== id))
      setSuccess('Mata pelajaran berhasil dihapus.')
    } catch (err) {
      console.error('Error deleting subject:', err)
      setError('Gagal menghapus mata pelajaran.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCsv = () => {
    const headers = ['code', 'name', 'description']
    const rows = sortedSubjects.map((item) => [item.code, item.name, item.description || ''])
    const csv = toCsv(headers, rows)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
    downloadCsv(`subjects_${stamp}.csv`, csv)
  }

  const handleDownloadTemplate = () => {
    const headers = ['code', 'name', 'description']
    const rows = [['MAT101', 'Matematika', 'Mata pelajaran dasar']]
    const csv = toCsv(headers, rows)
    downloadCsv('subjects_template.csv', csv)
  }

  const handleImportClick = () => {
    setError('')
    setSuccess('')
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError('')
    setSuccess('')

    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setError('CSV kosong atau format tidak valid. Gunakan header: code,name,description')
        return
      }

      const payloads = rows.map((row) => ({
        code: (row.code || '').trim().toUpperCase(),
        name: (row.name || '').trim(),
        description: (row.description || '').trim() || undefined,
      }))

      const validPayloads = payloads.filter((item) => item.code && item.name)
      if (validPayloads.length === 0) {
        setError('Tidak ada baris valid. Kolom wajib: code dan name.')
        return
      }

      let created = 0
      let failed = 0
      const failureLines: string[] = []

      for (let i = 0; i < validPayloads.length; i += 1) {
        const item = validPayloads[i]
        try {
          await apiClient.post('/subjects', item)
          created += 1
        } catch (err: any) {
          failed += 1
          const reason = err?.response?.data?.error || 'error'
          if (failureLines.length < 10) {
            failureLines.push(`Baris ${i + 2} (${item.code}): ${reason}`)
          }
        }
      }

      await fetchSubjects()

      if (failed === 0) {
        setSuccess(`Import selesai. ${created} mata pelajaran berhasil dibuat.`)
      } else {
        const details = failureLines.join(' | ')
        setSuccess(`Import selesai. Berhasil: ${created}, gagal: ${failed}.`)
        setError(details)
      }
    } catch (err) {
      console.error('Import CSV failed:', err)
      setError('Gagal membaca file CSV.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mata Pelajaran</h1>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleDownloadTemplate}>
            Template CSV
          </button>
          <button className="btn-secondary" onClick={handleExportCsv} disabled={loading || sortedSubjects.length === 0}>
            Export CSV
          </button>
          {isAdmin && (
            <>
              <button className="btn-secondary" onClick={handleImportClick} disabled={importing}>
                {importing ? 'Import...' : 'Import CSV'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportFile}
              />
              <Link href="/dashboard/subjects/new" className="btn-primary">
                + Tambah Mata Pelajaran
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari kode atau nama..."
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
          <button className="btn-secondary" onClick={() => handleSort('code')}>
            Kode {sortKey === 'code' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
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

      {loading ? (
        <div className="card text-center py-8">Memuat...</div>
      ) : sortedSubjects.length === 0 ? (
        <div className="card text-center py-8">Tidak ada mata pelajaran</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Kode</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Deskripsi</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedSubjects.map((subject) => (
                <tr key={subject.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{subject.code}</td>
                  <td className="px-6 py-4 text-sm font-medium">{subject.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{subject.description || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <Link href={`/dashboard/subjects/${subject.id}`} className="text-blue-600 hover:text-blue-800">
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            onClick={() => handleDelete(subject.id)}
                            disabled={deletingId === subject.id}
                          >
                            {deletingId === subject.id ? 'Menghapus...' : 'Hapus'}
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
        Menampilkan {pagedSubjects.length} dari {sortedSubjects.length} mata pelajaran (Total: {subjects.length})
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
