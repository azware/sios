'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">SIOS</h1>
        <p className="text-xl">Sistem Informasi Operasional Sekolah</p>
        <p className="mt-4 text-blue-100">Loading...</p>
      </div>
    </div>
  )
}
