import apiClient from './api'

export interface User {
  id: number
  username: string
  email: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
}

export interface AuthResponse {
  token: string
  user: User
}

export const authService = {
  async register(username: string, email: string, password: string, role: string = 'STUDENT'): Promise<User> {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
      role,
    })
    return response.data
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    })
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    }
    return null
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  },
}
