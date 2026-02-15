'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

export default function AttendancePage() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAttendance = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/attendance')
      setCount(Array.isArray(response.data) ? response.data.length : 0)
    } catch (err) {
      console.error('Error:', err)
      setError('Gagal memuat data kehadiran.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Kehadiran</h1>
      {error && (
        <div className="card mb-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button className="btn-secondary mt-3" onClick={fetchAttendance} disabled={loading}>
            Coba Lagi
          </button>
        </div>
      )}
      <div className="card">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        ) : count === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-700">Belum ada data kehadiran.</p>
            <p className="text-sm text-gray-500 mt-1">Mulai dengan menambahkan kehadiran pertama.</p>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">Total kehadiran tercatat: {count}</p>
        )}
        <button className="btn-primary" disabled={loading}>
          + Tambah Kehadiran
        </button>
      </div>
    </div>
  )
}
