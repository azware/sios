'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'

interface StudentDetail {
  id: number
  nis: string
  nisn: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  class?: { name: string; level: string }
  user?: { email: string; role: string }
}

export default function StudentDetailPage() {
  const params = useParams()
  const studentId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return
      try {
        const response = await apiClient.get(`/students/${studentId}`)
        setStudent(response.data)
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat detail siswa.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [studentId])

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Memuat detail siswa...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/dashboard/students" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Data siswa tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Siswa</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/students/${student.id}`} className="btn-primary">
            Edit
          </Link>
          <Link href="/dashboard/students" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-sm text-gray-500">Nama</p>
          <p className="text-lg font-semibold text-gray-900">{student.name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">NIS</p>
            <p className="text-gray-900">{student.nis}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">NISN</p>
            <p className="text-gray-900">{student.nisn}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{student.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telepon</p>
            <p className="text-gray-900">{student.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Lahir</p>
            <p className="text-gray-900">
              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Jenis Kelamin</p>
            <p className="text-gray-900">{student.gender || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Kelas</p>
            <p className="text-gray-900">
              {student.class ? `${student.class.name} (Tingkat ${student.class.level})` : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">User</p>
            <p className="text-gray-900">{student.user?.email || '-'}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Alamat</p>
          <p className="text-gray-900">{student.address || '-'}</p>
        </div>
      </div>
    </div>
  )
}
