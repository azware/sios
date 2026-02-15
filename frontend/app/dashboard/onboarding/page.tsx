'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'

type Step = 'school' | 'class' | 'subject' | 'done'

interface SchoolOption {
  id: number
  name: string
}

interface SchoolForm {
  name: string
  email: string
  phone: string
  address: string
}

interface ClassForm {
  name: string
  level: string
  schoolId: string
}

interface SubjectForm {
  code: string
  name: string
  description: string
}

const initialSchoolForm: SchoolForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
}

const initialClassForm: ClassForm = {
  name: '',
  level: '10',
  schoolId: '',
}

const initialSubjectForm: SubjectForm = {
  code: '',
  name: '',
  description: '',
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('school')
  const [loading, setLoading] = useState(true)
  const [savingSchool, setSavingSchool] = useState(false)
  const [savingClass, setSavingClass] = useState(false)
  const [savingSubject, setSavingSubject] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [counts, setCounts] = useState({ schools: 0, classes: 0, subjects: 0 })

  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [schoolForm, setSchoolForm] = useState<SchoolForm>(initialSchoolForm)
  const [classForm, setClassForm] = useState<ClassForm>(initialClassForm)
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(initialSubjectForm)

  const selectedSchoolName = useMemo(() => {
    const selectedId = Number(classForm.schoolId)
    return schools.find((item) => item.id === selectedId)?.name || '-'
  }, [classForm.schoolId, schools])

  const steps: Array<{ key: Step; label: string; title: string; description: string }> = [
    {
      key: 'school',
      label: 'Sekolah',
      title: 'Langkah 1: Buat Sekolah Pertama',
      description: 'Tambahkan data sekolah agar struktur data lain bisa mengikuti.',
    },
    {
      key: 'class',
      label: 'Kelas',
      title: 'Langkah 2: Buat Kelas Pertama',
      description: 'Siapkan kelas utama untuk menempatkan siswa.',
    },
    {
      key: 'subject',
      label: 'Mapel',
      title: 'Langkah 3: Buat Mata Pelajaran Pertama',
      description: 'Tambahkan mapel utama untuk penjadwalan dan penilaian.',
    },
    {
      key: 'done',
      label: 'Selesai',
      title: 'Setup Awal Selesai',
      description: 'Lanjutkan manajemen data lainnya.',
    },
  ]

  const activeIndex = steps.findIndex((item) => item.key === step)
  const progressValue = Math.max(0, Math.min(100, ((activeIndex + 1) / steps.length) * 100))
  const canGoBack = activeIndex > 0

  const goToStep = (target: Step) => {
    setError('')
    setSuccess('')
    setStep(target)
  }

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      setError('')
      try {
        const [schoolsRes, classesRes, subjectsRes] = await Promise.all([
          apiClient.get('/schools'),
          apiClient.get('/classes'),
          apiClient.get('/subjects'),
        ])
        const schoolItems: SchoolOption[] = Array.isArray(schoolsRes.data) ? schoolsRes.data : []
        const classItems: Array<{ id: number }> = Array.isArray(classesRes.data) ? classesRes.data : []
        const subjectItems: Array<{ id: number }> = Array.isArray(subjectsRes.data) ? subjectsRes.data : []

        setSchools(schoolItems)
        setCounts({
          schools: schoolItems.length,
          classes: classItems.length,
          subjects: subjectItems.length,
        })

        if (schoolItems.length === 0) {
          setStep('school')
          return
        }

        if (classItems.length === 0) {
          setStep('class')
          setClassForm((prev) => ({ ...prev, schoolId: String(schoolItems[0].id) }))
          return
        }

        if (subjectItems.length === 0) {
          setStep('subject')
          return
        }

        setStep('done')
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Gagal memuat data onboarding.')
      } finally {
        setLoading(false)
      }
    }

    boot()
  }, [])

  const refreshSchools = async (preferredSchoolId?: number) => {
    const response = await apiClient.get('/schools')
    const schoolItems: SchoolOption[] = Array.isArray(response.data) ? response.data : []
    setSchools(schoolItems)
    if (schoolItems.length > 0) {
      const fallbackId = preferredSchoolId ?? schoolItems[0].id
      setClassForm((prev) => ({ ...prev, schoolId: String(fallbackId) }))
    }
  }

  const handleCreateSchool = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!schoolForm.name.trim()) {
      setError('Nama sekolah wajib diisi.')
      return
    }

    setSavingSchool(true)
    try {
      const response = await apiClient.post('/schools', {
        name: schoolForm.name.trim(),
        email: schoolForm.email.trim() || undefined,
        phone: schoolForm.phone.trim() || undefined,
        address: schoolForm.address.trim() || undefined,
      })

      const created = response.data
      await refreshSchools(created.id)
      setSuccess('Sekolah awal berhasil dibuat. Lanjut ke pembuatan kelas pertama.')
      setStep('class')
      setSchoolForm(initialSchoolForm)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal membuat sekolah.')
    } finally {
      setSavingSchool(false)
    }
  }

  const handleCreateClass = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!classForm.name.trim() || !classForm.level.trim() || !classForm.schoolId) {
      setError('Nama kelas, tingkat, dan sekolah wajib diisi.')
      return
    }

    setSavingClass(true)
    try {
      await apiClient.post('/classes', {
        name: classForm.name.trim(),
        level: classForm.level.trim(),
        schoolId: Number(classForm.schoolId),
      })

      setSuccess('Kelas pertama berhasil dibuat. Lanjut ke pembuatan mata pelajaran pertama.')
      setStep('subject')
      setClassForm(initialClassForm)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal membuat kelas.')
    } finally {
      setSavingClass(false)
    }
  }

  const handleCreateSubject = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      setError('Kode dan nama mata pelajaran wajib diisi.')
      return
    }

    setSavingSubject(true)
    try {
      await apiClient.post('/subjects', {
        code: subjectForm.code.trim().toUpperCase(),
        name: subjectForm.name.trim(),
        description: subjectForm.description.trim() || undefined,
      })

      setSuccess('Mata pelajaran pertama berhasil dibuat. Setup awal selesai.')
      setStep('done')
      setSubjectForm(initialSubjectForm)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal membuat mata pelajaran.')
    } finally {
      setSavingSubject(false)
    }
  }

  if (loading) {
    return (
      <div className="card py-8">
        <p className="text-gray-600 text-center">Memuat data onboarding...</p>
        <div className="mt-6 space-y-3">
          <div className="h-3 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Wizard</h1>
        <Link href="/dashboard" className="btn-secondary">
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Progress</p>
            <div className="flex items-center gap-2 text-sm">
              {steps.map((item, index) => {
                const isActive = item.key === step
                const isDone =
                  (item.key === 'school' && counts.schools > 0) ||
                  (item.key === 'class' && counts.classes > 0) ||
                  (item.key === 'subject' && counts.subjects > 0) ||
                  item.key === 'done'
                return (
                  <span
                    key={item.key}
                    className={`px-3 py-1 rounded-full ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
                  >
                    {index + 1}. {item.label}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="w-full md:w-56">
            <div className="h-2 w-full bg-gray-100 rounded">
              <div className="h-2 bg-blue-600 rounded" style={{ width: `${progressValue}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {activeIndex + 1} dari {steps.length} langkah
            </p>
          </div>
        </div>
      </div>

      {error && <div className="card text-red-600">{error}</div>}
      {success && <div className="card text-green-700">{success}</div>}

      {step === 'school' && (
        <form onSubmit={handleCreateSchool} className="card space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{steps[0].title}</h2>
            <p className="text-sm text-gray-600">{steps[0].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah *</label>
              <input
                className="input-field"
                value={schoolForm.name}
                onChange={(e) => setSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={savingSchool}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                className="input-field"
                type="email"
                value={schoolForm.email}
                onChange={(e) => setSchoolForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={savingSchool}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                className="input-field"
                value={schoolForm.phone}
                onChange={(e) => setSchoolForm((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={savingSchool}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              className="input-field"
              rows={3}
              value={schoolForm.address}
              onChange={(e) => setSchoolForm((prev) => ({ ...prev, address: e.target.value }))}
              disabled={savingSchool}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingSchool}>
            {savingSchool ? 'Menyimpan...' : 'Simpan Sekolah'}
          </button>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Sudah punya sekolah? Lewati onboarding kapan saja.</span>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              Lewati &amp; kembali
            </Link>
          </div>
        </form>
      )}

      {step === 'class' && (
        <form onSubmit={handleCreateClass} className="card space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{steps[1].title}</h2>
            <p className="text-sm text-gray-600">{steps[1].description}</p>
          </div>
          {schools.length === 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              Anda belum memiliki sekolah. Buat sekolah terlebih dahulu untuk melanjutkan.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas *</label>
              <input
                className="input-field"
                placeholder="Contoh: 10A"
                value={classForm.name}
                onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={savingClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat *</label>
              <input
                className="input-field"
                placeholder="Contoh: 10"
                value={classForm.level}
                onChange={(e) => setClassForm((prev) => ({ ...prev, level: e.target.value }))}
                disabled={savingClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sekolah *</label>
              <select
                className="input-field"
                value={classForm.schoolId}
                onChange={(e) => setClassForm((prev) => ({ ...prev, schoolId: e.target.value }))}
                disabled={savingClass}
                required
              >
                <option value="">Pilih sekolah</option>
                {schools.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Kelas ini akan dibuat untuk sekolah: <span className="font-medium">{selectedSchoolName}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={savingClass || schools.length === 0}>
              {savingClass ? 'Menyimpan...' : schools.length === 0 ? 'Tambah Sekolah Dulu' : 'Simpan Kelas'}
            </button>
            {canGoBack && (
              <button type="button" className="btn-secondary" onClick={() => goToStep('school')}>
                Kembali
              </button>
            )}
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              Lewati &amp; kembali
            </Link>
          </div>
        </form>
      )}

      {step === 'subject' && (
        <form onSubmit={handleCreateSubject} className="card space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{steps[2].title}</h2>
            <p className="text-sm text-gray-600">{steps[2].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
              <input
                className="input-field"
                placeholder="Contoh: MAT101"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
                disabled={savingSubject}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran *</label>
              <input
                className="input-field"
                placeholder="Contoh: Matematika"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={savingSubject}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              className="input-field"
              rows={3}
              value={subjectForm.description}
              onChange={(e) => setSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
              disabled={savingSubject}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingSubject}>
            {savingSubject ? 'Menyimpan...' : 'Simpan Mata Pelajaran'}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {canGoBack && (
              <button type="button" className="btn-secondary" onClick={() => goToStep('class')}>
                Kembali
              </button>
            )}
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              Lewati &amp; kembali
            </Link>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{steps[3].title}</h2>
            <p className="text-gray-700">{steps[3].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Sekolah</p>
              <p className="text-2xl font-semibold text-gray-900">{counts.schools}</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Kelas</p>
              <p className="text-2xl font-semibold text-gray-900">{counts.classes}</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Mapel</p>
              <p className="text-2xl font-semibold text-gray-900">{counts.subjects}</p>
            </div>
          </div>
          {(counts.schools === 0 || counts.classes === 0 || counts.subjects === 0) && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              Setup belum lengkap. Anda bisa menambahkan data yang masih kosong kapan saja dari menu dashboard.
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/students/new" className="btn-primary">
              Tambah Siswa
            </Link>
            <Link href="/dashboard/teachers/new" className="btn-secondary">
              Tambah Guru
            </Link>
            <Link href="/dashboard/subjects" className="btn-secondary">
              Lihat Mata Pelajaran
            </Link>
            <button type="button" className="btn-secondary" onClick={() => goToStep('class')}>
              Tambah Kelas Lagi
            </button>
            <button type="button" className="btn-secondary" onClick={() => goToStep('subject')}>
              Tambah Mapel Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
