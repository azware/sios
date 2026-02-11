'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authService, User } from '@/lib/auth'
import RoleGuard from '@/components/RoleGuard'

const routeRules: Array<{ pattern: RegExp; roles: User['role'][] }> = [
  { pattern: /^\/dashboard$/, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { pattern: /^\/dashboard\/onboarding$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/students\/\d+\/detail$/, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { pattern: /^\/dashboard\/students\/new$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/students\/\d+$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/students$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/teachers\/\d+\/detail$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/teachers\/new$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/teachers\/\d+$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/teachers$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/classes\/\d+\/detail$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/classes\/new$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/classes\/\d+$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/classes$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/subjects\/new$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/subjects\/\d+$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/subjects$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/schools(\/.*)?$/, roles: ['ADMIN'] },
  { pattern: /^\/dashboard\/attendance$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/grades$/, roles: ['ADMIN', 'TEACHER'] },
  { pattern: /^\/dashboard\/payments$/, roles: ['ADMIN', 'TEACHER'] },
]

const isRouteAllowed = (pathname: string, role: User['role']) => {
  const matched = routeRules.find((rule) => rule.pattern.test(pathname))
  if (!matched) return false
  return matched.roles.includes(role)
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [allowed, setAllowed] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)
  }, [router])

  useEffect(() => {
    if (!user) return
    const canAccess = isRouteAllowed(pathname, user.role)
    setAllowed(canAccess)
    if (!canAccess && pathname !== '/dashboard') {
      router.replace('/dashboard')
    }
  }, [pathname, router, user])

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'DB', roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { label: 'Onboarding', href: '/dashboard/onboarding', icon: 'ON', roles: ['ADMIN'] },
    { label: 'Siswa', href: '/dashboard/students', icon: 'SW', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Guru', href: '/dashboard/teachers', icon: 'GR', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Kelas', href: '/dashboard/classes', icon: 'KL', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Sekolah', href: '/dashboard/schools', icon: 'SC', roles: ['ADMIN'] },
    { label: 'Mata Pelajaran', href: '/dashboard/subjects', icon: 'MP', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Kehadiran', href: '/dashboard/attendance', icon: 'KH', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Nilai', href: '/dashboard/grades', icon: 'NL', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Pembayaran', href: '/dashboard/payments', icon: 'BY', roles: ['ADMIN', 'TEACHER'] },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`w-64 bg-gray-900 text-white transition-all duration-300 overflow-y-auto ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold">SIOS</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? '<' : '>'}
          </button>
        </div>

        <nav className="mt-8">
          {menuItems
            .filter((item) => (user ? item.roles.includes(user.role) : false))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition"
              >
                <span className="text-xs font-semibold w-8">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
          {sidebarOpen && (
            <div>
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="font-medium mb-4">{user?.username}</p>
              <button onClick={handleLogout} className="w-full btn-secondary">
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.username}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{user?.role}</span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RoleGuard allowed={allowed}>{children}</RoleGuard>
        </div>
      </main>
    </div>
  )
}
