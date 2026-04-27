import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import Students from '@/views/faculty/Students.vue'
import Courses from '@/views/faculty/Courses.vue'
import ClassRecords from '@/views/faculty/Students-Records.vue'
import sampleRecord from '@/views/faculty/sampleRecord.vue'
import StudentRecord from '@/views/faculty/ClassRecord.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword },
  { path: '/faculty/courses', component: Courses, meta: { requiresFaculty: true } },
  { path: '/faculty/students', component: Students, meta: { requiresFaculty: true } },
  {
    path: '/faculty/courses/:courseId/class-record',
    name: 'ClassRecord',
    component: ClassRecords,
    meta: { requiresFaculty: true },
  },
  { path: '/faculty/sample', component: sampleRecord, meta: { requiresFaculty: true } },

  { path: '/faculty/records', component: StudentRecord, meta: { requiresFaculty: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  await auth.fetchUser()

  const publicAuthRoutes = ['/', '/register', '/forgot-password', '/reset-password']

  if (auth.user && publicAuthRoutes.includes(to.path)) {
    if (auth.role === 'Faculty') {
      next('/faculty/courses')
    } else if (auth.role === 'Admin') {
      next('/admin/dashboard')
    } else {
      next('/')
    }
    return
  }

  // Protect faculty routes
  if (to.meta.requiresFaculty && auth.role !== 'Faculty') {
    next('/')
  } else {
    next()
  }
})

export default router
