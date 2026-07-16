import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import LoginPage from '@/views/LoginPage.vue'
import RegisterPage from '@/views/RegisterPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import AdminLoginPage from '@/views/AdminLoginPage.vue'
import AdminDashboardPage from '@/views/AdminDashboardPage.vue'
import InternshipNeedNew from '@/views/InternshipNeedNew.vue'
import InternshipNeedsBrowse from '@/views/InternshipNeedsBrowse.vue'
import SkillTestPage from '@/views/SkillTestPage.vue'
import TestResultsPage from '@/views/TestResultsPage.vue'
import MatchmakingPage from '@/views/MatchmakingPage.vue'
import InternshipDetailPage from '@/views/InternshipDetailPage.vue'
import EvaluationPage from '@/views/EvaluationPage.vue'
import ProfileEditPage from '@/views/ProfileEditPage.vue'
import NotificationsPage from '@/views/NotificationsPage.vue'

function getTokenPayload() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return null
    }
    return payload
  } catch {
    return null
  }
}

// const ADMIN_SUPERADMIN_ROUTES = ['admin-matches', 'admin-settings']
// const ADMIN_MODERATOR_PLUS_ROUTES = ['admin-verification', 'admin-questions']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { guest: true } },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { auth: true } },
    { path: '/internship-needs/new', name: 'internship-need-new', component: InternshipNeedNew, meta: { auth: true } },
    { path: '/internship-needs/browse', name: 'internship-needs-browse', component: InternshipNeedsBrowse, meta: { auth: true } },
    { path: '/skill-test', name: 'skill-test', component: SkillTestPage, meta: { auth: true } },
    { path: '/skill-test/attempt/:id', name: 'skill-test-attempt', component: SkillTestPage, meta: { auth: true } },
    { path: '/skill-test/results', name: 'skill-test-results', component: TestResultsPage, meta: { auth: true } },
    { path: '/internship-needs/:id/edit', name: 'internship-need-edit', component: InternshipNeedNew, meta: { auth: true } },
    { path: '/matchmaking', name: 'matchmaking', component: MatchmakingPage, meta: { auth: true } },
    { path: '/internships/:id', name: 'internship-detail', component: InternshipDetailPage, meta: { auth: true } },
    { path: '/internships/:id/evaluate', name: 'internship-evaluate', component: EvaluationPage, meta: { auth: true } },
    { path: '/profile/edit', name: 'profile-edit', component: ProfileEditPage, meta: { auth: true } },
    { path: '/notifications', name: 'notifications', component: NotificationsPage, meta: { auth: true } },

    // Admin routes
    { path: '/admin/login', name: 'admin-login', component: AdminLoginPage, meta: { guest: true } },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true },
    },
    {
      path: '/admin/verification',
      name: 'admin-verification',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true, minRoleLevel: 'moderator' },
    },
    {
      path: '/admin/questions',
      name: 'admin-questions',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true, minRoleLevel: 'moderator' },
    },
    {
      path: '/admin/internships',
      name: 'admin-internships',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true },
    },
    {
      path: '/admin/matches',
      name: 'admin-matches',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true, minRoleLevel: 'superadmin' },
    },
    {
      path: '/admin/tickets',
      name: 'admin-tickets',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true },
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true, minRoleLevel: 'superadmin' },
    },
  ],
})

const ROLE_HIERARCHY = { superadmin: 3, moderator: 2, support: 1 }

router.beforeEach(async (to) => {
  const payload = getTokenPayload()
  const isAuthenticated = !!payload
  const role = payload?.role || null

  if (to.meta.auth && !isAuthenticated) {
    return { name: to.meta.adminOnly ? 'admin-login' : 'login' }
  }

  if (to.meta.adminOnly && role !== 'admin') {
    return { name: 'dashboard' }
  }

  // Check roleLevel for admin routes
  if (to.meta.adminOnly && to.meta.minRoleLevel && role === 'admin') {
    try {
      const { useAuthStore } = await import('@/stores/auth')
      const auth = useAuthStore()
      if (!auth.profile) await auth.fetchProfile()
      const userLevel = auth.userRoleLevel
      const requiredLevel = ROLE_HIERARCHY[to.meta.minRoleLevel] || 0
      const currentLevel = ROLE_HIERARCHY[userLevel] || 0
      if (currentLevel < requiredLevel) {
        return { name: 'admin-dashboard' }
      }
    } catch {
      return { name: 'admin-dashboard' }
    }
  }

  if (to.meta.guest && isAuthenticated) {
    if (to.name === 'admin-login') {
      return { name: role === 'admin' ? 'admin-dashboard' : 'dashboard' }
    }
    return { name: role === 'admin' ? 'admin-dashboard' : 'dashboard' }
  }
})

export default router
