'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'

interface TeacherDetail {
  id: number
  nip: string
  name: string
  email: string
  phone?: string
  school?: { name: string }
  subjects?: Array<{ name: string }>
  user?: { email: string; role: string }
}

export default function TeacherDetailPage() {
  const params = useParams()
  const teacherId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!teacherId) return
      try {
        const response = await apiClient.get(`/teachers/${teacherId}`)
        setTeacher(response.data)
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat detail guru.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeacher()
  }, [teacherId])

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Memuat detail guru...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/dashboard/teachers" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Data guru tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Guru</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/teachers/${teacher.id}`} className="btn-primary">
            Edit
          </Link>
          <Link href="/dashboard/teachers" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-sm text-gray-500">Nama</p>
          <p className="text-lg font-semibold text-gray-900">{teacher.name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">NIP</p>
            <p className="text-gray-900">{teacher.nip}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{teacher.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telepon</p>
            <p className="text-gray-900">{teacher.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sekolah</p>
            <p className="text-gray-900">{teacher.school?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">User</p>
            <p className="text-gray-900">{teacher.user?.email || '-'}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Mata Pelajaran</p>
          <p className="text-gray-900">
            {teacher.subjects && teacher.subjects.length > 0
              ? teacher.subjects.map((subject) => subject.name).join(', ')
              : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
