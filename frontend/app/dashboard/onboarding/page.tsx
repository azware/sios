'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'

type Step = 'school' | 'class' | 'done'

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

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('school')
  const [loading, setLoading] = useState(true)
  const [savingSchool, setSavingSchool] = useState(false)
  const [savingClass, setSavingClass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [schoolForm, setSchoolForm] = useState<SchoolForm>(initialSchoolForm)
  const [classForm, setClassForm] = useState<ClassForm>(initialClassForm)

  const selectedSchoolName = useMemo(() => {
    const selectedId = Number(classForm.schoolId)
    return schools.find((item) => item.id === selectedId)?.name || '-'
  }, [classForm.schoolId, schools])

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      setError('')
      try {
        const [schoolsRes, classesRes] = await Promise.all([apiClient.get('/schools'), apiClient.get('/classes')])
        const schoolItems: SchoolOption[] = Array.isArray(schoolsRes.data) ? schoolsRes.data : []
        const classItems: Array<{ id: number }> = Array.isArray(classesRes.data) ? classesRes.data : []

        setSchools(schoolItems)

        if (schoolItems.length === 0) {
          setStep('school')
          return
        }

        if (classItems.length === 0) {
          setStep('class')
          setClassForm((prev) => ({ ...prev, schoolId: String(schoolItems[0].id) }))
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

      setSuccess('Kelas pertama berhasil dibuat. Setup awal selesai.')
      setStep('done')
      setClassForm(initialClassForm)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal membuat kelas.')
    } finally {
      setSavingClass(false)
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Memuat data onboarding...</p>
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
        <div className="flex items-center gap-3 text-sm">
          <span className={`px-3 py-1 rounded-full ${step === 'school' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>1. Sekolah</span>
          <span className={`px-3 py-1 rounded-full ${step === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>2. Kelas</span>
          <span className={`px-3 py-1 rounded-full ${step === 'done' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>3. Selesai</span>
        </div>
      </div>

      {error && <div className="card text-red-600">{error}</div>}
      {success && <div className="card text-green-700">{success}</div>}

      {step === 'school' && (
        <form onSubmit={handleCreateSchool} className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Langkah 1: Buat Sekolah Pertama</h2>
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
        </form>
      )}

      {step === 'class' && (
        <form onSubmit={handleCreateClass} className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Langkah 2: Buat Kelas Pertama</h2>
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
          <button type="submit" className="btn-primary" disabled={savingClass}>
            {savingClass ? 'Menyimpan...' : 'Simpan Kelas'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Setup Awal Selesai</h2>
          <p className="text-gray-700">Data dasar sekolah dan kelas sudah tersedia. Anda bisa lanjut ke manajemen data lainnya.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/students/new" className="btn-primary">
              Tambah Siswa
            </Link>
            <Link href="/dashboard/teachers/new" className="btn-secondary">
              Tambah Guru
            </Link>
            <Link href="/dashboard/subjects/new" className="btn-secondary">
              Tambah Mata Pelajaran
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
