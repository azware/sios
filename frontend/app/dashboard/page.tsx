'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalPayments: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalPayments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, teachersRes, classesRes, paymentsRes] = await Promise.all([
          apiClient.get('/students'),
          apiClient.get('/teachers'),
          apiClient.get('/classes'),
          apiClient.get('/payments'),
        ])

        setStats({
          totalStudents: Array.isArray(studentsRes.data) ? studentsRes.data.length : 0,
          totalTeachers: Array.isArray(teachersRes.data) ? teachersRes.data.length : 0,
          totalClasses: Array.isArray(classesRes.data) ? classesRes.data.length : 0,
          totalPayments: Array.isArray(paymentsRes.data) ? paymentsRes.data.length : 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Siswa', value: stats.totalStudents, color: 'blue', icon: '👤' },
    { label: 'Total Guru', value: stats.totalTeachers, color: 'green', icon: '👨‍🏫' },
    { label: 'Total Kelas', value: stats.totalClasses, color: 'purple', icon: '📚' },
    { label: 'Total Pembayaran', value: stats.totalPayments, color: 'orange', icon: '💳' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Selamat Datang di SIOS</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '-' : card.value}
                </p>
              </div>
              <span className="text-4xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fitur Utama</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Manajemen Data Siswa dan Guru</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Tracking Kehadiran Siswa</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Pencatatan Nilai dan Grade</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">Sistem Pembayaran Terintegrasi</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Panduan Cepat</h2>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-gray-700">Kelola data siswa dan guru</li>
            <li className="text-gray-700">Buat kelas dan jadwal mata pelajaran</li>
            <li className="text-gray-700">Catat kehadiran dan nilai siswa</li>
            <li className="text-gray-700">Kelola pembayaran dan laporan</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
