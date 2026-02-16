import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock the API module
vi.mock('@/api', () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn()
  }
}))

import { api } from '@/api'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('checkAuth sets user when logged in', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'user' }
    api.me.mockResolvedValue({ user: mockUser })

    const store = useAuthStore()
    await store.checkAuth()

    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.checked).toBe(true)
  })

  it('checkAuth handles unauthenticated', async () => {
    api.me.mockRejectedValue(new Error('Unauthorized'))

    const store = useAuthStore()
    await store.checkAuth()

    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.checked).toBe(true)
  })

  it('login sets user on success', async () => {
    const mockUser = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }
    api.login.mockResolvedValue({ user: mockUser })

    const store = useAuthStore()
    await store.login('admin@test.com', 'password')

    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.isAdmin).toBe(true)
  })

  it('login throws on failure', async () => {
    api.login.mockRejectedValue(new Error('Invalid credentials'))

    const store = useAuthStore()
    await expect(store.login('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials')

    expect(store.isAuthenticated).toBe(false)
  })

  it('logout clears user', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'user' }
    api.me.mockResolvedValue({ user: mockUser })
    api.logout.mockResolvedValue({})

    const store = useAuthStore()
    await store.checkAuth()
    expect(store.isAuthenticated).toBe(true)

    await store.logout()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('isAdmin returns true for admin role', async () => {
    api.login.mockResolvedValue({ user: { id: 1, name: 'A', role: 'admin' } })
    const store = useAuthStore()
    await store.login('a@a.com', 'p')
    expect(store.isAdmin).toBe(true)
  })

  it('isAdmin returns false for user role', async () => {
    api.login.mockResolvedValue({ user: { id: 2, name: 'U', role: 'user' } })
    const store = useAuthStore()
    await store.login('u@u.com', 'p')
    expect(store.isAdmin).toBe(false)
  })
})
