'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'

interface School {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'phone'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const user = authService.getCurrentUser()

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiClient.get('/schools')
        setSchools(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        console.error('Error fetching schools:', err)
        setError('Gagal memuat data sekolah.')
      } finally {
        setLoading(false)
      }
    }

    fetchSchools()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortKey, sortDir])

  const filteredSchools = schools.filter((school) => {
    const term = searchTerm.toLowerCase()
    return school.name.toLowerCase().includes(term)
  })

  const sortedSchools = [...filteredSchools].sort((a, b) => {
    const getValue = (school: School) => {
      switch (sortKey) {
        case 'email':
          return school.email || ''
        case 'phone':
          return school.phone || ''
        case 'name':
        default:
          return school.name
      }
    }
    const aValue = getValue(a).toLowerCase()
    const bValue = getValue(b).toLowerCase()
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedSchools.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedSchools = sortedSchools.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus data sekolah ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    try {
      await apiClient.delete(`/schools/${id}`)
      setSchools((prev) => prev.filter((school) => school.id !== id))
    } catch (err) {
      console.error('Error deleting school:', err)
      setError('Gagal menghapus sekolah.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Sekolah</h1>
        {user?.role === 'ADMIN' && (
          <Link href="/dashboard/schools/new" className="btn-primary">
            + Tambah Sekolah
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari nama sekolah..."
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
          <button className="btn-secondary" onClick={() => handleSort('email')}>
            Email {sortKey === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button className="btn-secondary" onClick={() => handleSort('phone')}>
            Telepon {sortKey === 'phone' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
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
          <p className="text-gray-600">Memuat data sekolah...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : sortedSchools.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Tidak ada sekolah ditemukan</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telepon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedSchools.map((school, index) => (
                <tr key={school.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{school.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{school.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{school.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/schools/${school.id}/detail`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Detail
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link href={`/dashboard/schools/${school.id}`} className="text-blue-600 hover:text-blue-800">
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            onClick={() => handleDelete(school.id)}
                            disabled={deletingId === school.id}
                          >
                            {deletingId === school.id ? 'Menghapus...' : 'Hapus'}
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
        Menampilkan {pagedSchools.length} dari {sortedSchools.length} sekolah (Total: {schools.length})
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
