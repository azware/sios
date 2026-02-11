'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'

interface Teacher {
  id: number
  nip: string
  name: string
  email: string
  phone?: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'nip' | 'email'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const user = authService.getCurrentUser()

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await apiClient.get('/teachers')
        setTeachers(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Error fetching teachers:', error)
        setError('Gagal memuat data guru.')
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortKey, sortDir])

  const filteredTeachers = teachers.filter((teacher) => {
    const term = searchTerm.toLowerCase()
    return (
      teacher.name.toLowerCase().includes(term) ||
      teacher.nip.toLowerCase().includes(term) ||
      teacher.email.toLowerCase().includes(term)
    )
  })

  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    const getValue = (teacher: Teacher) => {
      switch (sortKey) {
        case 'nip':
          return teacher.nip
        case 'email':
          return teacher.email
        case 'name':
        default:
          return teacher.name
      }
    }
    const aValue = getValue(a).toLowerCase()
    const bValue = getValue(b).toLowerCase()
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedTeachers = sortedTeachers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus data guru ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    try {
      await apiClient.delete(`/teachers/${id}`)
      setTeachers((prev) => prev.filter((teacher) => teacher.id !== id))
    } catch (err) {
      console.error('Error deleting teacher:', err)
      setError('Gagal menghapus guru.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Guru</h1>
        {user?.role === 'ADMIN' && (
          <Link href="/dashboard/teachers/new" className="btn-primary">
            + Tambah Guru
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari nama, NIP, atau email..."
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
          <button className="btn-secondary" onClick={() => handleSort('nip')}>
            NIP {sortKey === 'nip' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button className="btn-secondary" onClick={() => handleSort('email')}>
            Email {sortKey === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
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

      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Memuat data guru...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : sortedTeachers.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Tidak ada guru ditemukan</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">NIP</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telepon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedTeachers.map((teacher, index) => (
                <tr key={teacher.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.nip}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/teachers/${teacher.id}/detail`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Detail
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link
                            href={`/dashboard/teachers/${teacher.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            onClick={() => handleDelete(teacher.id)}
                            disabled={deletingId === teacher.id}
                          >
                            {deletingId === teacher.id ? 'Menghapus...' : 'Hapus'}
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
        Menampilkan {pagedTeachers.length} dari {sortedTeachers.length} guru (Total: {teachers.length})
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
