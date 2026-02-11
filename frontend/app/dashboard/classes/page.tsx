'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'

interface Class {
  id: number
  name: string
  level: string
  students?: Array<any>
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'level'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const user = authService.getCurrentUser()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await apiClient.get('/classes')
        setClasses(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Error fetching classes:', error)
        setError('Gagal memuat data kelas.')
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

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
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus data kelas ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    try {
      await apiClient.delete(`/classes/${id}`)
      setClasses((prev) => prev.filter((kelas) => kelas.id !== id))
    } catch (err) {
      console.error('Error deleting class:', err)
      setError('Gagal menghapus kelas.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Kelas</h1>
        {user?.role === 'ADMIN' && (
          <Link href="/dashboard/classes/new" className="btn-primary">
            + Tambah Kelas
          </Link>
        )}
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
          <button className="btn-primary">Cari</button>
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

      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Memuat data kelas...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-8">
          <p className="text-red-600">{error}</p>
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
                {user?.role === 'ADMIN' && (
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
        <button
          className="btn-secondary"
          disabled={currentPage === 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
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
