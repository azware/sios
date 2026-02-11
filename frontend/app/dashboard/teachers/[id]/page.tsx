'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface TeacherForm {
  nip: string
  name: string
  email: string
  phone: string
}

type TeacherFieldErrors = Partial<Record<keyof TeacherForm, string>>

const initialForm: TeacherForm = {
  nip: '',
  name: '',
  email: '',
  phone: '',
}

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams()
  const teacherId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [form, setForm] = useState<TeacherForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<TeacherFieldErrors>({})

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!teacherId) return
      try {
        const response = await apiClient.get(`/teachers/${teacherId}`)
        const teacher = response.data
        setForm({
          nip: teacher.nip || '',
          name: teacher.name || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
        })
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat data guru.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeacher()
  }, [teacherId])

  const handleChange = (field: keyof TeacherForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})

    if (!teacherId) {
      setError('ID guru tidak valid.')
      return
    }

    const nextErrors: TeacherFieldErrors = {}
    if (!form.nip) nextErrors.nip = 'NIP wajib diisi.'
    if (!form.name) nextErrors.name = 'Nama wajib diisi.'
    if (!form.email) nextErrors.email = 'Email wajib diisi.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    setSaving(true)
    try {
      await apiClient.put(`/teachers/${teacherId}`, {
        nip: form.nip,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
      })

      setSuccess('Perubahan guru berhasil disimpan.')
      setTimeout(() => router.push('/dashboard/teachers'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['nip', 'email'].includes(field)) {
        const messageMap: Record<string, string> = {
          nip: 'NIP sudah terdaftar.',
          email: 'Email sudah terdaftar.',
        }
        setFieldErrors((prev) => ({ ...prev, [field]: messageMap[field] || 'Data sudah terdaftar.' }))
      }
      const message = err?.response?.data?.error || 'Gagal menyimpan perubahan.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Memuat data guru...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Guru</h1>
        <Link href="/dashboard/teachers" className="btn-secondary">
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIP *</label>
            <input
              className="input-field"
              value={form.nip}
              onChange={(e) => handleChange('nip', e.target.value)}
              required
              disabled={saving}
            />
            {fieldErrors.nip && <p className="text-xs text-red-600 mt-1">{fieldErrors.nip}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />
            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              disabled={saving}
            />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <Link href="/dashboard/teachers" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
