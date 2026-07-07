import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { api } from "@/lib/api"

export const useNotificationStore = defineStore("notification", () => {
  const items = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)

  async function fetchNotifications(limit = 10) {
    try {
      const res = await api.get(`/notifications?limit=${limit}`)
      items.value = Array.isArray(res) ? res : []
    } catch {
      // silent
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await api.get("/notifications/unread-count")
      unreadCount.value = res.count || 0
    } catch {
      // silent
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      const found = items.value.find((n) => n.id === id)
      if (found) found.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all")
      items.value.forEach((n) => (n.isRead = true))
      unreadCount.value = 0
    } catch {
      // silent
    }
  }

  const recentUnread = computed(() =>
    items.value.filter((n) => !n.isRead).slice(0, 5),
  )

  return {
    items,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    recentUnread,
  }
})
