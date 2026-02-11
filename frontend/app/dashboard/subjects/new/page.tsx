'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface SubjectForm {
  code: string
  name: string
  description: string
}

type SubjectFieldErrors = Partial<Record<keyof SubjectForm, string>>

const initialForm: SubjectForm = {
  code: '',
  name: '',
  description: '',
}

export default function NewSubjectPage() {
  const router = useRouter()
  const [form, setForm] = useState<SubjectForm>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SubjectFieldErrors>({})

  const handleChange = (field: keyof SubjectForm, value: string) => {
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

    const nextErrors: SubjectFieldErrors = {}
    if (!form.code) nextErrors.code = 'Kode wajib diisi.'
    if (!form.name) nextErrors.name = 'Nama wajib diisi.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/subjects', {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
      })

      setSuccess('Mata pelajaran berhasil dibuat.')
      setTimeout(() => router.push('/dashboard/subjects'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['code'].includes(field)) {
        setFieldErrors((prev) => ({ ...prev, code: 'Kode sudah terdaftar.' }))
      }
      const message = err?.response?.data?.error || 'Gagal membuat mata pelajaran.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Mata Pelajaran</h1>
        <Link href="/dashboard/subjects" className="btn-secondary">
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
            <input
              className="input-field"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              disabled={loading}
            />
            {fieldErrors.code && <p className="text-xs text-red-600 mt-1">{fieldErrors.code}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={loading}
            />
            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link href="/dashboard/subjects" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
