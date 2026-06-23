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
import MatchmakingPage from '@/views/MatchmakingPage.vue'
import InternshipDetailPage from '@/views/InternshipDetailPage.vue'
import EvaluationPage from '@/views/EvaluationPage.vue'
import ProfileEditPage from '@/views/ProfileEditPage.vue'

function getRoleFromToken() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1])).role
  } catch {
    return null
  }
}

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
    { path: '/matchmaking', name: 'matchmaking', component: MatchmakingPage, meta: { auth: true } },
    { path: '/internships/:id', name: 'internship-detail', component: InternshipDetailPage, meta: { auth: true } },
    { path: '/internships/:id/evaluate', name: 'internship-evaluate', component: EvaluationPage, meta: { auth: true } },
    { path: '/profile/edit', name: 'profile-edit', component: ProfileEditPage, meta: { auth: true } },

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
      meta: { auth: true, adminOnly: true },
    },
    {
      path: '/admin/questions',
      name: 'admin-questions',
      component: AdminDashboardPage,
      meta: { auth: true, adminOnly: true },
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
      meta: { auth: true, adminOnly: true },
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
      meta: { auth: true, adminOnly: true },
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  const role = getRoleFromToken()

  if (to.meta.auth && !isAuthenticated) {
    return { name: to.meta.adminOnly ? 'admin-login' : 'login' }
  }
  if (to.meta.adminOnly && role !== 'admin') {
    return { name: 'dashboard' }
  }
  if (to.meta.guest && isAuthenticated) {
    if (to.name === 'admin-login') {
      return { name: role === 'admin' ? 'admin-dashboard' : 'dashboard' }
    }
    return { name: role === 'admin' ? 'admin-dashboard' : 'dashboard' }
  }
})

export default router
