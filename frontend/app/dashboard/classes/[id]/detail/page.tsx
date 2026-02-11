'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'

interface ClassDetail {
  id: number
  name: string
  level: string
  school?: { name: string }
  students?: Array<{ id: number; name: string; nis: string }>
}

export default function ClassDetailPage() {
  const params = useParams()
  const classId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [kelas, setKelas] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return
      try {
        const response = await apiClient.get(`/classes/${classId}`)
        setKelas(response.data)
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat detail kelas.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchClass()
  }, [classId])

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Memuat detail kelas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/dashboard/classes" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  if (!kelas) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Data kelas tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Kelas</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/classes/${kelas.id}`} className="btn-primary">
            Edit
          </Link>
          <Link href="/dashboard/classes" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nama Kelas</p>
            <p className="text-lg font-semibold text-gray-900">{kelas.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tingkat</p>
            <p className="text-gray-900">{kelas.level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sekolah</p>
            <p className="text-gray-900">{kelas.school?.name || '-'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Daftar Siswa</p>
          {kelas.students && kelas.students.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {kelas.students.map((student) => (
                <li key={student.id} className="text-gray-900">
                  {student.name} - {student.nis}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-900">Belum ada siswa.</p>
          )}
        </div>
      </div>
    </div>
  )
}
