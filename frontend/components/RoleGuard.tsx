'use client'

import { ReactNode } from 'react'

export default function RoleGuard({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  if (!allowed) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">Akses ditolak untuk halaman ini.</p>
      </div>
    )
  }

  return <>{children}</>
}
