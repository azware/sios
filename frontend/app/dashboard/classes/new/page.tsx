'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface ClassForm {
  name: string
  level: string
  schoolId: string
}

type ClassFieldErrors = Partial<Record<keyof ClassForm, string>>

interface SchoolOption {
  id: number
  name: string
}

const initialForm: ClassForm = {
  name: '',
  level: '',
  schoolId: '',
}

export default function NewClassPage() {
  const router = useRouter()
  const [form, setForm] = useState<ClassForm>(initialForm)
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ClassFieldErrors>({})

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiClient.get('/schools')
        setSchools(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setError('Gagal memuat data sekolah')
      }
    }

    fetchSchools()
  }, [])

  const schoolOptions = useMemo(
    () => schools.map((item) => ({ value: String(item.id), label: item.name })),
    [schools]
  )

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

    const nextErrors: ClassFieldErrors = {}
    if (!form.name) nextErrors.name = 'Nama kelas wajib diisi.'
    if (!form.level) nextErrors.level = 'Tingkat wajib diisi.'
    if (!form.schoolId) nextErrors.schoolId = 'Sekolah wajib dipilih.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    const schoolId = Number(form.schoolId)
    if (!Number.isFinite(schoolId)) {
      setError('School ID harus berupa angka.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/classes', {
        name: form.name,
        level: form.level,
        schoolId,
      })

      setSuccess('Kelas berhasil dibuat.')
      setTimeout(() => router.push('/dashboard/classes'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['name'].includes(field)) {
        setFieldErrors((prev) => ({ ...prev, name: 'Nama kelas sudah terdaftar.' }))
      }
      const message = err?.response?.data?.error || 'Gagal membuat kelas.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Kelas</h1>
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
              placeholder="Contoh: 10A"
              required
              disabled={loading}
            />
            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat *</label>
            <input
              className="input-field"
              value={form.level}
              onChange={(e) => handleChange('level', e.target.value)}
              placeholder="Contoh: 10"
              required
              disabled={loading}
            />
            {fieldErrors.level && <p className="text-xs text-red-600 mt-1">{fieldErrors.level}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sekolah *</label>
            <select
              className="input-field"
              value={form.schoolId}
              onChange={(e) => handleChange('schoolId', e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Pilih sekolah</option>
              {schoolOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.schoolId && <p className="text-xs text-red-600 mt-1">{fieldErrors.schoolId}</p>}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link href="/dashboard/classes" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
