import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.restoreAllMocks()
})

global.fetch = vi.fn()

function mockFetchResponse(status, body) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  })
}

describe('authStore', () => {
  it('starts with null user and no token', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('reads token from localStorage on init', () => {
    localStorage.setItem('token', 'existing-token')
    const store = useAuthStore()
    expect(store.token).toBe('existing-token')
    expect(store.isAuthenticated).toBe(true)
  })

  it('login sets token and fetches profile', async () => {
    const store = useAuthStore()
    mockFetchResponse(200, { token: 'new-token' })
    mockFetchResponse(200, { user: { role: 'student' }, profile: { id: 'p1' } })
    await store.login('student@test.id', 'password')
    expect(store.token).toBe('new-token')
    expect(localStorage.getItem('token')).toBe('new-token')
    expect(store.user).toEqual({ role: 'student' })
    expect(store.profile).toEqual({ id: 'p1' })
    expect(store.isAuthenticated).toBe(true)
  })

  it('login throws on failure and clears error on retry', async () => {
    const store = useAuthStore()
    mockFetchResponse(401, { error: 'Invalid credentials' })
    await expect(store.login('bad@email.com', 'wrong')).rejects.toThrow('Invalid credentials')
    expect(store.error).toBe('Invalid credentials')
    expect(store.token).toBeNull()
  })

  it('register creates account and sets token', async () => {
    const store = useAuthStore()
    mockFetchResponse(201, { token: 'reg-token' })
    mockFetchResponse(200, { user: { role: 'student' }, profile: { id: 'p1' } })
    await store.register({ email: 'new@student.id', password: '123', role: 'student' })
    expect(store.token).toBe('reg-token')
    expect(localStorage.getItem('token')).toBe('reg-token')
  })

  it('logout clears all auth state and removes token', () => {
    localStorage.setItem('token', 'some-token')
    const store = useAuthStore()
    store.user = { role: 'student' }
    store.profile = { id: 'p1' }
    store.logout()
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
    expect(store.token).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('fetchProfile logs out on API failure', async () => {
    const store = useAuthStore()
    store.token = 'invalid-token'
    localStorage.setItem('token', 'invalid-token')
    mockFetchResponse(401, { error: 'Unauthorized' })
    await store.fetchProfile()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('userRole returns null when no user', () => {
    const store = useAuthStore()
    expect(store.userRole).toBeNull()
  })

  it('userRole returns role from user', () => {
    const store = useAuthStore()
    store.user = { role: 'umkm' }
    expect(store.userRole).toBe('umkm')
  })
})
