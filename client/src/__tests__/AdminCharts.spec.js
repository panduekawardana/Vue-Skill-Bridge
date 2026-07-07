import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
  localStorage.clear()
})

global.fetch = vi.fn()

function mockFetch(status, body) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  })
}

// Helper to process registration data (same logic as in AdminCharts.vue)
function processRegistrations(data) {
  if (!data) return { labels: [], datasets: [] }
  const regs = data.registrations || []
  const dateSet = new Set()
  const studentMap = {}
  const umkmMap = {}
  for (const r of regs) {
    dateSet.add(r.date)
    if (r.role === 'student') studentMap[r.date] = r.count
    else if (r.role === 'umkm') umkmMap[r.date] = r.count
  }
  const labels = [...dateSet].sort()
  return {
    labels,
    datasets: [
      { label: 'Siswa', backgroundColor: '#3b82f6', data: labels.map(d => studentMap[d] || 0) },
      { label: 'UMKM', backgroundColor: '#8b5cf6', data: labels.map(d => umkmMap[d] || 0) },
    ],
  }
}

function processInternshipStatus(data) {
  if (!data) return { labels: [], datasets: [] }
  const items = data.internshipStatuses || []
  const colorMap = { scheduled: '#f59e0b', active: '#10b981', completed: '#6366f1', cancelled: '#ef4444' }
  return {
    labels: items.map(i => i.status),
    datasets: [{ data: items.map(i => i.count), backgroundColor: items.map(i => colorMap[i.status] || '#94a3b8'), borderWidth: 0 }],
  }
}

function processMatchStatus(data) {
  if (!data) return { labels: [], datasets: [] }
  const items = data.matchStatuses || []
  const colorMap = { pending: '#f59e0b', accepted: '#10b981', rejected: '#ef4444', expired: '#94a3b8' }
  return {
    labels: items.map(i => i.status),
    datasets: [{ data: items.map(i => i.count), backgroundColor: items.map(i => colorMap[i.status] || '#94a3b8'), borderWidth: 0 }],
  }
}

describe('AdminCharts data processing', () => {
  describe('processRegistrations', () => {
    it('returns empty for null data', () => {
      const result = processRegistrations(null)
      expect(result.labels).toEqual([])
      expect(result.datasets).toEqual([])
    })

    it('groups registrations by date and role', () => {
      const data = {
        registrations: [
          { date: '2026-01-01', role: 'student', count: 5 },
          { date: '2026-01-01', role: 'umkm', count: 2 },
          { date: '2026-01-02', role: 'student', count: 3 },
        ],
      }
      const result = processRegistrations(data)
      expect(result.labels).toEqual(['2026-01-01', '2026-01-02'])
      expect(result.datasets[0].label).toBe('Siswa')
      expect(result.datasets[0].data).toEqual([5, 3])
      expect(result.datasets[1].label).toBe('UMKM')
      expect(result.datasets[1].data).toEqual([2, 0])
    })

    it('handles empty registrations', () => {
      const result = processRegistrations({ registrations: [] })
      expect(result.labels).toEqual([])
      expect(result.datasets[0].data).toEqual([])
    })
  })

  describe('processInternshipStatus', () => {
    it('maps statuses to labels and colors', () => {
      const data = {
        internshipStatuses: [
          { status: 'active', count: 10 },
          { status: 'completed', count: 5 },
          { status: 'cancelled', count: 2 },
        ],
      }
      const result = processInternshipStatus(data)
      expect(result.labels).toEqual(['active', 'completed', 'cancelled'])
      expect(result.datasets[0].data).toEqual([10, 5, 2])
      expect(result.datasets[0].backgroundColor).toHaveLength(3)
      expect(result.datasets[0].backgroundColor[0]).toBe('#10b981')
      expect(result.datasets[0].backgroundColor[1]).toBe('#6366f1')
      expect(result.datasets[0].backgroundColor[2]).toBe('#ef4444')
    })
  })

  describe('processMatchStatus', () => {
    it('maps match statuses with colors', () => {
      const data = {
        matchStatuses: [
          { status: 'pending', count: 7 },
          { status: 'accepted', count: 12 },
          { status: 'rejected', count: 3 },
          { status: 'expired', count: 1 },
        ],
      }
      const result = processMatchStatus(data)
      expect(result.labels).toEqual(['pending', 'accepted', 'rejected', 'expired'])
      expect(result.datasets[0].data).toEqual([7, 12, 3, 1])
      expect(result.datasets[0].backgroundColor[0]).toBe('#f59e0b')
      expect(result.datasets[0].backgroundColor[1]).toBe('#10b981')
      expect(result.datasets[0].backgroundColor[2]).toBe('#ef4444')
      expect(result.datasets[0].backgroundColor[3]).toBe('#94a3b8')
    })
  })
})

describe('AdminCharts component', () => {
  it('renders loading state on mount', async () => {
    // Don't resolve the fetch so it stays in loading state
    global.fetch.mockImplementationOnce(() => new Promise(() => {}))
    const AdminCharts = (await import('@/components/admin/AdminCharts.vue')).default
    const wrapper = mount(AdminCharts)
    expect(wrapper.text()).toContain('Memuat grafik')
  })

  it('renders chart section after loading data', async () => {
    const chartData = {
      registrations: [{ date: '2026-01-01', role: 'student', count: 10 }],
      internshipStatuses: [{ status: 'active', count: 5 }],
      matchStatuses: [{ status: 'pending', count: 3 }],
      needStatuses: [{ status: 'open', count: 2 }],
    }
    mockFetch(200, chartData)
    const AdminCharts = (await import('@/components/admin/AdminCharts.vue')).default
    const wrapper = mount(AdminCharts)
    await new Promise(r => setTimeout(r, 50))
    expect(wrapper.text()).toContain('Grafik')
    expect(wrapper.text()).toContain('Registrasi Pengguna')
    expect(wrapper.text()).toContain('Status Magang')
    expect(wrapper.text()).toContain('Status Match')
  })

  it('shows filter buttons for all periods', async () => {
    mockFetch(200, { registrations: [], internshipStatuses: [], matchStatuses: [], needStatuses: [] })
    const AdminCharts = (await import('@/components/admin/AdminCharts.vue')).default
    const wrapper = mount(AdminCharts)
    await new Promise(r => setTimeout(r, 50))
    const buttons = wrapper.findAll('button')
    const filterLabels = ['7 Hari', '30 Hari', '90 Hari', 'Semua']
    for (const label of filterLabels) {
      expect(wrapper.text()).toContain(label)
    }
  })
})
