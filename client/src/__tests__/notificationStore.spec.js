import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})

global.fetch = vi.fn()

function mockFetch(status, body) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  })
}

const sampleNotifications = [
  { id: '1', type: 'match', title: 'Match Baru', body: 'Test', isRead: false, createdAt: '2026-01-01' },
  { id: '2', type: 'evaluation', title: 'Ulasan Baru', body: 'Test', isRead: true, createdAt: '2026-01-02' },
  { id: '3', type: 'system', title: 'Info', body: 'Test', isRead: false, createdAt: '2026-01-03' },
]

describe('notificationStore', () => {
  it('starts with empty state', () => {
    const store = useNotificationStore()
    expect(store.items).toEqual([])
    expect(store.unreadCount).toBe(0)
    expect(store.loading).toBe(false)
  })

  it('fetchNotifications populates items', async () => {
    const store = useNotificationStore()
    mockFetch(200, sampleNotifications)
    await store.fetchNotifications(10)
    expect(store.items).toHaveLength(3)
    expect(store.items[0].id).toBe('1')
  })

  it('fetchNotifications handles non-array response', async () => {
    const store = useNotificationStore()
    mockFetch(200, { error: 'not array' })
    await store.fetchNotifications(10)
    expect(store.items).toEqual([])
  })

  it('fetchNotifications handles API error silently', async () => {
    const store = useNotificationStore()
    mockFetch(500, {})
    await store.fetchNotifications(10)
    expect(store.items).toEqual([])
  })

  it('fetchUnreadCount updates count', async () => {
    const store = useNotificationStore()
    mockFetch(200, { count: 5 })
    await store.fetchUnreadCount()
    expect(store.unreadCount).toBe(5)
  })

  it('fetchUnreadCount defaults to 0 on missing count', async () => {
    const store = useNotificationStore()
    mockFetch(200, {})
    await store.fetchUnreadCount()
    expect(store.unreadCount).toBe(0)
  })

  it('fetchUnreadCount handles error silently', async () => {
    const store = useNotificationStore()
    mockFetch(500, {})
    await store.fetchUnreadCount()
    expect(store.unreadCount).toBe(0)
  })

  it('markRead marks notification as read and decrements count', async () => {
    const store = useNotificationStore()
    store.items = JSON.parse(JSON.stringify(sampleNotifications))
    store.unreadCount = 2
    mockFetch(200, {})
    await store.markRead('1')
    expect(store.items.find(n => n.id === '1')?.isRead).toBe(true)
    expect(store.unreadCount).toBe(1)
  })

  it('markRead handles error silently', async () => {
    const store = useNotificationStore()
    store.items = JSON.parse(JSON.stringify(sampleNotifications))
    store.unreadCount = 2
    mockFetch(500, {})
    await store.markRead('1')
    expect(store.items.find(n => n.id === '1')?.isRead).toBe(false)
    expect(store.unreadCount).toBe(2)
  })

  it('markAllRead marks all as read and resets count', async () => {
    const store = useNotificationStore()
    store.items = JSON.parse(JSON.stringify(sampleNotifications))
    store.unreadCount = 2
    mockFetch(200, {})
    await store.markAllRead()
    expect(store.items.every(n => n.isRead)).toBe(true)
    expect(store.unreadCount).toBe(0)
  })

  it('recentUnread returns up to 5 unread items', () => {
    const store = useNotificationStore()
    store.items = JSON.parse(JSON.stringify([
      { id: '1', isRead: false },
      { id: '2', isRead: false },
      { id: '3', isRead: true },
      { id: '4', isRead: false },
    ]))
    expect(store.recentUnread).toHaveLength(3)
    expect(store.recentUnread.every(n => !n.isRead)).toBe(true)
  })
})
