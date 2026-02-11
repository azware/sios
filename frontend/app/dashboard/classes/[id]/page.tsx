'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface ClassForm {
  name: string
  level: string
}

type ClassFieldErrors = Partial<Record<keyof ClassForm, string>>

const initialForm: ClassForm = {
  name: '',
  level: '',
}

export default function EditClassPage() {
  const router = useRouter()
  const params = useParams()
  const classId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [form, setForm] = useState<ClassForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ClassFieldErrors>({})

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return
      try {
        const response = await apiClient.get(`/classes/${classId}`)
        const kelas = response.data
        setForm({
          name: kelas.name || '',
          level: kelas.level || '',
        })
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat data kelas.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchClass()
  }, [classId])

  const handleChange = (field: keyof ClassForm, value: string) => {
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

    if (!classId) {
      setError('ID kelas tidak valid.')
      return
    }

    const nextErrors: ClassFieldErrors = {}
    if (!form.name) nextErrors.name = 'Nama kelas wajib diisi.'
    if (!form.level) nextErrors.level = 'Tingkat wajib diisi.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    setSaving(true)
    try {
      await apiClient.put(`/classes/${classId}`, {
        name: form.name,
        level: form.level,
      })

      setSuccess('Perubahan kelas berhasil disimpan.')
      setTimeout(() => router.push('/dashboard/classes'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['name'].includes(field)) {
        setFieldErrors((prev) => ({ ...prev, name: 'Nama kelas sudah terdaftar.' }))
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
        <p className="text-gray-600">Memuat data kelas...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Kelas</h1>
        <Link href="/dashboard/classes" className="btn-secondary">
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat *</label>
            <input
              className="input-field"
              value={form.level}
              onChange={(e) => handleChange('level', e.target.value)}
              required
              disabled={saving}
            />
            {fieldErrors.level && <p className="text-xs text-red-600 mt-1">{fieldErrors.level}</p>}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <Link href="/dashboard/classes" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
