import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from '@/lib/api'

const BASE_URL = "http://localhost:5000/api"

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

function mockFetch(status, body) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    })
  )
}

describe('api.get', () => {
  it('makes GET request to correct URL', async () => {
    mockFetch(200, { data: 'ok' })
    await api.get('/test')
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/test`,
      expect.objectContaining({ headers: { "Content-Type": "application/json" } })
    )
  })

  it('returns parsed JSON on success', async () => {
    mockFetch(200, { id: 1, name: 'test' })
    const result = await api.get('/test')
    expect(result).toEqual({ id: 1, name: 'test' })
  })

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-jwt-token')
    mockFetch(200, {})
    await api.get('/secure')
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/secure`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-jwt-token' }),
      })
    )
  })

  it('throws error with server message on failure', async () => {
    mockFetch(400, { error: 'Bad request' })
    await expect(api.get('/fail')).rejects.toThrow('Bad request')
  })

  it('throws default error when server has no message', async () => {
    mockFetch(500, {})
    await expect(api.get('/crash')).rejects.toThrow('Terjadi kesalahan')
  })
})

describe('api.post', () => {
  it('sends JSON body with POST method', async () => {
    mockFetch(201, { id: 1 })
    await api.post('/create', { name: 'new' })
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/create`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'new' }),
      })
    )
  })
})

describe('api.put', () => {
  it('sends JSON body with PUT method', async () => {
    mockFetch(200, { id: 1 })
    await api.put('/update/1', { name: 'updated' })
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/update/1`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'updated' }),
      })
    )
  })
})

describe('api.patch', () => {
  it('sends JSON body with PATCH method', async () => {
    mockFetch(200, { success: true })
    await api.patch('/item/1', { status: 'active' })
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/item/1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      })
    )
  })
})

describe('api.delete', () => {
  it('sends DELETE request', async () => {
    mockFetch(200, { message: 'deleted' })
    await api.delete('/item/1')
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/item/1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('api convenience methods', () => {
  it('api.register posts to /auth/register', async () => {
    mockFetch(201, { token: 'abc' })
    const result = await api.register({ email: 'a@b.com', password: '123' })
    expect(result).toEqual({ token: 'abc' })
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/auth/register`,
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('api.login posts to /auth/login', async () => {
    mockFetch(200, { token: 'xyz' })
    const result = await api.login({ email: 'a@b.com', password: '123' })
    expect(result).toEqual({ token: 'xyz' })
  })

  it('api.me gets /auth/me', async () => {
    mockFetch(200, { user: { id: 1 } })
    const result = await api.me()
    expect(result).toEqual({ user: { id: 1 } })
  })

  it('api.getAdminStats gets /admin/dashboard', async () => {
    mockFetch(200, { totalStudents: 10 })
    const result = await api.getAdminStats()
    expect(result).toEqual({ totalStudents: 10 })
  })
})
