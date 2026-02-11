'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface ClassOption {
  id: number
  name: string
  level: string
}

interface SchoolOption {
  id: number
  name: string
}

interface UserOption {
  id: number
  username: string
  email: string
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
  schoolId: string
  userId: string
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
  schoolId: '',
  userId: '',
}

export default function NewStudentPage() {
  const router = useRouter()
  const [form, setForm] = useState<StudentForm>(initialForm)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<StudentFieldErrors>({})
  const [createUser, setCreateUser] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [userError, setUserError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesResponse, schoolsResponse, usersResponse] = await Promise.all([
          apiClient.get('/classes'),
          apiClient.get('/schools'),
          apiClient.get('/users?role=STUDENT'),
        ])
        setClasses(Array.isArray(classesResponse.data) ? classesResponse.data : [])
        setSchools(Array.isArray(schoolsResponse.data) ? schoolsResponse.data : [])
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : [])
      } catch (err) {
        setError('Gagal memuat data referensi')
      }
    }

    fetchData()
  }, [])

  const classOptions = useMemo(
    () => classes.map((item) => ({ value: String(item.id), label: `${item.name} (Tingkat ${item.level})` })),
    [classes]
  )

  const schoolOptions = useMemo(
    () => schools.map((item) => ({ value: String(item.id), label: item.name })),
    [schools]
  )

  const userOptions = useMemo(
    () => users.map((item) => ({ value: String(item.id), label: `${item.username} (${item.email})` })),
    [users]
  )

  const handleChange = (field: keyof StudentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError('')
    if (success) setSuccess('')
    if (field === 'email' && createUser && userError) {
      setUserError('')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})
    setUserError('')

    const nextErrors: StudentFieldErrors = {}
    if (!form.nis) nextErrors.nis = 'NIS wajib diisi.'
    if (!form.nisn) nextErrors.nisn = 'NISN wajib diisi.'
    if (!form.name) nextErrors.name = 'Nama wajib diisi.'
    if (!form.email) nextErrors.email = 'Email wajib diisi.'
    if (!form.classId) nextErrors.classId = 'Kelas wajib dipilih.'
    if (!form.schoolId) nextErrors.schoolId = 'Sekolah wajib dipilih.'
    if (!createUser && !form.userId) nextErrors.userId = 'User wajib dipilih.'
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Mohon lengkapi data wajib.')
      return
    }

    if (createUser) {
      if (!newUsername) {
        setUserError('Username wajib diisi.')
        return
      }
      if (!newPassword) {
        setUserError('Password wajib diisi.')
        return
      }
    }

    const classId = Number(form.classId)
    const schoolId = Number(form.schoolId)
    let userId = form.userId ? Number(form.userId) : NaN

    if (!Number.isFinite(classId) || !Number.isFinite(schoolId)) {
      setError('Class ID dan School ID harus berupa angka.')
      return
    }

    if (!createUser && !Number.isFinite(userId)) {
      setError('User ID harus berupa angka.')
      return
    }

    setLoading(true)
    try {
      if (createUser) {
        setUserError('')
        try {
          const registerResponse = await apiClient.post('/auth/register', {
            username: newUsername,
            email: form.email,
            password: newPassword,
            role: 'STUDENT',
          })
          userId = registerResponse.data.id
          setUsers((prev) => [...prev, registerResponse.data])
        } catch (err: any) {
          const field = err?.response?.data?.field
          if (field === 'username') {
            setUserError('Username sudah terdaftar.')
          } else if (field === 'email') {
            setUserError('Email sudah terdaftar.')
          } else {
            setUserError(err?.response?.data?.error || 'Gagal membuat user.')
          }
          setLoading(false)
          return
        }
      }

      await apiClient.post('/students', {
        nis: form.nis,
        nisn: form.nisn,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        classId,
        schoolId,
        userId,
      })

      setSuccess('Siswa berhasil dibuat.')
      setTimeout(() => router.push('/dashboard/students'), 800)
    } catch (err: any) {
      const field = err?.response?.data?.field
      if (field && ['nis', 'nisn', 'email', 'userId'].includes(field)) {
        const messageMap: Record<string, string> = {
          nis: 'NIS sudah terdaftar.',
          nisn: 'NISN sudah terdaftar.',
          email: 'Email sudah terdaftar.',
          userId: 'User sudah digunakan.',
        }
        setFieldErrors((prev) => ({ ...prev, [field]: messageMap[field] || 'Data sudah terdaftar.' }))
      }
      const message = err?.response?.data?.error || 'Gagal membuat siswa.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Siswa</h1>
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
              placeholder="Contoh: 2024001"
              required
              disabled={loading}
            />
            {fieldErrors.nis && <p className="text-xs text-red-600 mt-1">{fieldErrors.nis}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NISN *</label>
            <input
              className="input-field"
              value={form.nisn}
              onChange={(e) => handleChange('nisn', e.target.value)}
              placeholder="Contoh: 0012345678"
              required
              disabled={loading}
            />
            {fieldErrors.nisn && <p className="text-xs text-red-600 mt-1">{fieldErrors.nisn}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nama siswa"
              required
              disabled={loading}
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
              placeholder="email@siswa.sch.id"
              required
              disabled={loading}
            />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0812xxxxxxx"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
            <input
              className="input-field"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <select
              className="input-field"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              disabled={loading}
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
              disabled={loading}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Akun User (Role STUDENT) *</label>
            <select
              className="input-field"
              value={form.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              required
              disabled={createUser || loading}
            >
              <option value="">Pilih akun user</option>
              {userOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.userId && <p className="text-xs text-red-600 mt-1">{fieldErrors.userId}</p>}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2">
            <input
              id="createUserStudent"
              type="checkbox"
              checked={createUser}
              onChange={(e) => {
                setCreateUser(e.target.checked)
                setUserError('')
              }}
              disabled={loading}
            />
            <label htmlFor="createUserStudent" className="text-sm text-gray-700">
              Buat akun user baru (role STUDENT)
            </label>
          </div>
          {createUser && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  className="input-field"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  className="input-field"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
          {userError && <p className="text-sm text-red-600 mt-2">{userError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Alamat lengkap"
            disabled={loading}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link href="/dashboard/students" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
