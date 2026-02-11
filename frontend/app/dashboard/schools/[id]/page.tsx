'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface SchoolForm {
  name: string
  address: string
  phone: string
  email: string
}

type SchoolFieldErrors = Partial<Record<keyof SchoolForm, string>>

const initialForm: SchoolForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
}

export default function EditSchoolPage() {
  const router = useRouter()
  const params = useParams()
  const schoolId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [form, setForm] = useState<SchoolForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SchoolFieldErrors>({})

  useEffect(() => {
    const fetchSchool = async () => {
      if (!schoolId) return
      try {
        const response = await apiClient.get(`/schools/${schoolId}`)
        const school = response.data
        setForm({
          name: school.name || '',
          address: school.address || '',
          phone: school.phone || '',
          email: school.email || '',
        })
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat data sekolah.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchool()
  }, [schoolId])

  const handleChange = (field: keyof SchoolForm, value: string) => {
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

    if (!schoolId) {
      setError('ID sekolah tidak valid.')
      return
    }

    const nextErrors: SchoolFieldErrors = {}
    if (!form.name) nextErrors.name = 'Nama sekolah wajib diisi.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    setSaving(true)
    try {
      await apiClient.put(`/schools/${schoolId}`, {
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      })

      setSuccess('Perubahan sekolah berhasil disimpan.')
      setTimeout(() => router.push('/dashboard/schools'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['name'].includes(field)) {
        setFieldErrors((prev) => ({ ...prev, name: 'Nama sekolah sudah terdaftar.' }))
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
        <p className="text-gray-600">Memuat data sekolah...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Sekolah</h1>
        <Link href="/dashboard/schools" className="btn-secondary">
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={saving}
            />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={saving}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <Link href="/dashboard/schools" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
