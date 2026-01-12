export interface User {
  id: number
  name: string | null
  email: string
  role?: 'associate' | 'manager' | 'admin'
  theme?: 'dark' | 'light' | 'system' | 'iron-man'
  status?: 'active' | 'inactive'
  stores?: Array<{
    id: number
    number: string
  }>
}

export interface AuthData {
  isAuthenticated: boolean
}

export interface SharedProps {
  auth: AuthData
  user: User | null
  flash: {
    success?: string
    errors?: Record<string, string>
  }
}

export interface SharedPageProps extends SharedProps {
  sidebarOpen?: boolean
  [key: string]: unknown // to extend
}
