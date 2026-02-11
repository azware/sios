'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'

interface Student {
  id: number
  nis: string
  nisn: string
  name: string
  email: string
  classId?: number
  class?: { name: string }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'nis' | 'nisn' | 'email' | 'class'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const user = authService.getCurrentUser()

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiClient.get('/students')
        setStudents(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Error fetching students:', error)
        setError('Gagal memuat data siswa.')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortKey, sortDir])

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus data siswa ini? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmed) return

    setDeletingId(id)
    setError('')
    try {
      await apiClient.delete(`/students/${id}`)
      setStudents((prev) => prev.filter((student) => student.id !== id))
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
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Siswa</h1>
        {user?.role === 'ADMIN' && (
          <Link href="/dashboard/students/new" className="btn-primary">
            + Tambah Siswa
          </Link>
        )}
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
          <button className="btn-primary">Cari</button>
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

      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Memuat data siswa...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-8">
          <p className="text-red-600">{error}</p>
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
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.nis}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.nisn}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.class?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/students/${student.id}/detail`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Detail
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
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
