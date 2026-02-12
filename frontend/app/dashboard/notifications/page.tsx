'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api'

interface NotificationItem {
  id: string
  type: 'PAYMENT_OVERDUE' | 'ATTENDANCE_ALERT' | 'GRADE_ALERT'
  severity: 'high' | 'medium'
  title: string
  message: string
  count: number
  link: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiClient.get('/notifications')
        const notifications = Array.isArray(response.data?.items) ? response.data.items : []
        setItems(notifications)
      } catch {
        setError('Gagal memuat notifikasi')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const getBadgeClass = (severity: NotificationItem['severity']) => {
    return severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
      </div>

      {error && (
        <div className="card mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-8">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-8">Tidak ada notifikasi prioritas saat ini.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeClass(item.severity)}`}>
                  {item.severity === 'high' ? 'Tinggi' : 'Sedang'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">Jumlah: {item.count}</p>
                <Link href={item.link} className="btn-primary">
                  Tindak Lanjuti
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
