'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'

interface SchoolDetail {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  classes?: Array<{ id: number; name: string; level: string }>
  teachers?: Array<{ id: number; name: string; nip: string }>
  students?: Array<{ id: number; name: string; nis: string }>
}

export default function SchoolDetailPage() {
  const params = useParams()
  const schoolId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSchool = async () => {
      if (!schoolId) return
      try {
        const response = await apiClient.get(`/schools/${schoolId}`)
        setSchool(response.data)
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat detail sekolah.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchool()
  }, [schoolId])

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Memuat detail sekolah...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/dashboard/schools" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Data sekolah tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Sekolah</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/schools/${school.id}`} className="btn-primary">
            Edit
          </Link>
          <Link href="/dashboard/schools" className="btn-secondary">
            Kembali
          </Link>
        </div>
      </div>

      <div className="card space-y-6">
        <div>
          <p className="text-sm text-gray-500">Nama</p>
          <p className="text-lg font-semibold text-gray-900">{school.name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{school.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telepon</p>
            <p className="text-gray-900">{school.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Alamat</p>
            <p className="text-gray-900">{school.address || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Kelas</p>
            {school.classes && school.classes.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-gray-900">
                {school.classes.map((kelas) => (
                  <li key={kelas.id}>
                    {kelas.name} (Tingkat {kelas.level})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-900">Belum ada kelas.</p>
            )}
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Guru</p>
            {school.teachers && school.teachers.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-gray-900">
                {school.teachers.map((teacher) => (
                  <li key={teacher.id}>
                    {teacher.name} ({teacher.nip})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-900">Belum ada guru.</p>
            )}
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Siswa</p>
            {school.students && school.students.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-gray-900">
                {school.students.map((student) => (
                  <li key={student.id}>
                    {student.name} ({student.nis})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-900">Belum ada siswa.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
