import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { api } from "@/lib/api"

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null)
  const profile = ref(null)
  const token = ref(localStorage.getItem("token") || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role ?? null)
  const userRoleLevel = computed(() => profile.value?.roleLevel ?? null)

  async function fetchProfile() {
    try {
      const res = await api.me()
      user.value = res.user
      profile.value = res.profile
    } catch {
      logout()
    }
  }

  async function register(payload) {
    loading.value = true
    error.value = null
    try {
      const res = await api.register(payload)
      token.value = res.token
      localStorage.setItem("token", res.token)
      await fetchProfile()
      return res
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const res = await api.login({ email, password })
      token.value = res.token
      localStorage.setItem("token", res.token)
      await fetchProfile()
      return res
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    profile.value = null
    token.value = null
    localStorage.removeItem("token")
    error.value = null
  }

  return { user, profile, token, loading, error, isAuthenticated, userRole, userRoleLevel, register, login, logout, fetchProfile }
})
