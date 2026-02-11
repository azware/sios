'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

export default function AttendancePage() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await apiClient.get('/attendance')
        setCount(Array.isArray(response.data) ? response.data.length : 0)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Kehadiran</h1>
      <div className="card">
        <p className="text-gray-600 mb-4">Total kehadiran tercatat: {loading ? '...' : count}</p>
        <button className="btn-primary">+ Tambah Kehadiran</button>
      </div>
    </div>
  )
}
