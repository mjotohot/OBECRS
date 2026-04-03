import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import FacultyDashboard from '@/views/faculty/Dashboard.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword },
  { path: '/faculty/dashboard', component: FacultyDashboard },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// router.beforeEach(async (to, from, next) => {
//   const { data: { session } } = await supabase.auth.getSession()
//   if (!session) {
//     if (to.meta.requiresAuth) next('/login')
//     else next()
//     return
//   }

//   // Fetch role from your store or directly
//   const { data: profile } = await supabase
//     .from('user')
//     .select('role')
//     .eq('user_id', session.user.id)
//     .maybeSingle()

//   const role = profile?.role
//   const requiredRole = to.meta.role // e.g., meta: { role: 'Admin' }

//   if (requiredRole && role !== requiredRole) {
//     next('/unauthorized')
//   } else {
//     next()
//   }
// })

export default router
