'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface ClassOption {
  id: number
  name: string
  level: string
}

interface StudentForm {
  nis: string
  nisn: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  classId: string
}

type StudentFieldErrors = Partial<Record<keyof StudentForm, string>>

const initialForm: StudentForm = {
  nis: '',
  nisn: '',
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  classId: '',
}

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const [form, setForm] = useState<StudentForm>(initialForm)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<StudentFieldErrors>({})

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return
      try {
        const [studentResponse, classResponse] = await Promise.all([
          apiClient.get(`/students/${studentId}`),
          apiClient.get('/classes'),
        ])

        const student = studentResponse.data
        setForm({
          nis: student.nis || '',
          nisn: student.nisn || '',
          name: student.name || '',
          email: student.email || '',
          phone: student.phone || '',
          dateOfBirth: student.dateOfBirth
            ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
            : '',
          gender: student.gender || '',
          address: student.address || '',
          classId: student.classId ? String(student.classId) : '',
        })

        setClasses(Array.isArray(classResponse.data) ? classResponse.data : [])
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Gagal memuat data siswa.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  const classOptions = useMemo(
    () => classes.map((item) => ({ value: String(item.id), label: `${item.name} (Tingkat ${item.level})` })),
    [classes]
  )

  const handleChange = (field: keyof StudentForm, value: string) => {
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

    if (!studentId) {
      setError('ID siswa tidak valid.')
      return
    }

    const nextErrors: StudentFieldErrors = {}
    if (!form.nis) nextErrors.nis = 'NIS wajib diisi.'
    if (!form.nisn) nextErrors.nisn = 'NISN wajib diisi.'
    if (!form.name) nextErrors.name = 'Nama wajib diisi.'
    if (!form.email) nextErrors.email = 'Email wajib diisi.'
    if (!form.classId) nextErrors.classId = 'Kelas wajib dipilih.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    const classId = Number(form.classId)
    if (!Number.isFinite(classId)) {
      setError('Class ID harus berupa angka.')
      return
    }

    setSaving(true)
    try {
      await apiClient.put(`/students/${studentId}`, {
        nis: form.nis,
        nisn: form.nisn,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        classId,
      })

      setSuccess('Perubahan siswa berhasil disimpan.')
      setTimeout(() => router.push('/dashboard/students'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['nis', 'nisn', 'email'].includes(field)) {
        const messageMap: Record<string, string> = {
          nis: 'NIS sudah terdaftar.',
          nisn: 'NISN sudah terdaftar.',
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
        <p className="text-gray-600">Memuat data siswa...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Siswa</h1>
        <Link href="/dashboard/students" className="btn-secondary">
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIS *</label>
            <input
              className="input-field"
              value={form.nis}
              onChange={(e) => handleChange('nis', e.target.value)}
              required
              disabled={saving}
            />
            {fieldErrors.nis && <p className="text-xs text-red-600 mt-1">{fieldErrors.nis}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NISN *</label>
            <input
              className="input-field"
              value={form.nisn}
              onChange={(e) => handleChange('nisn', e.target.value)}
              required
              disabled={saving}
            />
            {fieldErrors.nisn && <p className="text-xs text-red-600 mt-1">{fieldErrors.nisn}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
            <input
              className="input-field"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <select
              className="input-field"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              disabled={saving}
            >
              <option value="">Pilih</option>
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
            <select
              className="input-field"
              value={form.classId}
              onChange={(e) => handleChange('classId', e.target.value)}
              required
              disabled={saving}
            >
              <option value="">Pilih kelas</option>
              {classOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.classId && <p className="text-xs text-red-600 mt-1">{fieldErrors.classId}</p>}
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
          <Link href="/dashboard/students" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
