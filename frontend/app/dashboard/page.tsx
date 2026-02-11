'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'
import { authService } from '@/lib/auth'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalPayments: number
}

interface SetupState {
  isAdmin: boolean
  needsOnboarding: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalPayments: 0,
  })
  const [setup, setSetup] = useState<SetupState>({
    isAdmin: false,
    needsOnboarding: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = authService.getCurrentUser()
      const isAdmin = currentUser?.role === 'ADMIN'

      try {
        const [studentsRes, teachersRes, classesRes, paymentsRes] = await Promise.all([
          apiClient.get('/students'),
          apiClient.get('/teachers'),
          apiClient.get('/classes'),
          apiClient.get('/payments'),
        ])

        const classCount = Array.isArray(classesRes.data) ? classesRes.data.length : 0

        setStats({
          totalStudents: Array.isArray(studentsRes.data) ? studentsRes.data.length : 0,
          totalTeachers: Array.isArray(teachersRes.data) ? teachersRes.data.length : 0,
          totalClasses: classCount,
          totalPayments: Array.isArray(paymentsRes.data) ? paymentsRes.data.length : 0,
        })

        if (isAdmin) {
          const [schoolsRes, subjectsRes] = await Promise.all([apiClient.get('/schools'), apiClient.get('/subjects')])
          const schoolCount = Array.isArray(schoolsRes.data) ? schoolsRes.data.length : 0
          const subjectCount = Array.isArray(subjectsRes.data) ? subjectsRes.data.length : 0
          setSetup({
            isAdmin: true,
            needsOnboarding: schoolCount === 0 || classCount === 0 || subjectCount === 0,
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Siswa', value: stats.totalStudents },
    { label: 'Total Guru', value: stats.totalTeachers },
    { label: 'Total Kelas', value: stats.totalClasses },
    { label: 'Total Pembayaran', value: stats.totalPayments },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Selamat Datang di SIOS</h1>

      {setup.isAdmin && setup.needsOnboarding && (
        <div className="card border-blue-200 bg-blue-50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Setup awal belum lengkap</h2>
              <p className="text-sm text-blue-800">Selesaikan onboarding untuk membuat sekolah dan kelas pertama.</p>
            </div>
            <Link href="/dashboard/onboarding" className="btn-primary">
              Buka Onboarding Wizard
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-gray-600 text-sm">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fitur Utama</h2>
          <ul className="space-y-3 text-gray-700">
            <li>Manajemen data siswa dan guru</li>
            <li>Tracking kehadiran siswa</li>
            <li>Pencatatan nilai dan grade</li>
            <li>Sistem pembayaran terintegrasi</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Panduan Cepat</h2>
          <ol className="space-y-3 list-decimal list-inside text-gray-700">
            <li>Kelola data siswa dan guru</li>
            <li>Buat kelas dan jadwal mata pelajaran</li>
            <li>Catat kehadiran dan nilai siswa</li>
            <li>Kelola pembayaran dan laporan</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
