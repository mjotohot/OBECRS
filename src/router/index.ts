import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import Students from '@/views/faculty/Students.vue'
import Courses from '@/views/faculty/Courses.vue'
import ClassRecords from '@/views/faculty/Students-Records.vue'
import StudentRecord from '@/views/faculty/ClassRecord.vue'
import COReport from '@/views/faculty/Reports.vue'
import Dashboard from '@/views/chairperson/Dashboard.vue'
import ClassRecord from '@/views/chairperson/ClassRecord.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword },
  { path: '/faculty/courses', component: Courses, meta: { requiresFaculty: true } },
  { path: '/faculty/students', component: Students, meta: { requiresFaculty: true } },
  {
    path: '/faculty/courses/:courseId/class-record',
    name: 'FacultyClassRecord',
    component: ClassRecords,
    meta: { requiresFaculty: true },
  },
  {
    path: '/faculty/courses/:courseId/co-report',
    name: 'FacultyCOReport',
    component: COReport,
    meta: { requiresFaculty: true },
  },
  { path: '/faculty/records', component: StudentRecord, meta: { requiresFaculty: true } },

  //Chairperson routes
  { path: '/chairperson/dashboard', component: Dashboard, meta: { requiresChairperson: true } },
  { path: '/chairperson/class-record', component: ClassRecord, meta: { requiresChairperson: true } },
  {
    path: '/chairperson/dashboard/:courseId/class-record',
    name: 'ChairpersonDashboardClassRecord',
    component: COReport,
    meta: { requiresChairperson: true },
  },
  {
    path: '/chairperson/courses/:courseId/class-record',
    name: 'ChairpersonClassRecord',
    component: ClassRecords,
    meta: { requiresChairperson: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()
  await auth.fetchUser()

  const publicAuthRoutes = ['/', '/register', '/forgot-password', '/reset-password']

  // If user is authenticated and trying to access public auth pages
  if (auth.user && publicAuthRoutes.includes(to.path)) {
    if (auth.role === 'Faculty') {
      return '/faculty/courses'
    } else if (auth.role === 'Admin') {
      return '/admin/dashboard'
    } else if (auth.role === 'Chairperson') {
      return '/chairperson/dashboard'
    }
  }

  // Protect faculty routes
  if (to.meta.requiresFaculty && auth.role !== 'Faculty') {
    return '/'
  }
  
  // Protect chairperson routes
  if (to.meta.requiresChairperson && auth.role !== 'Chairperson') {
    return '/'
  }

  // Allow navigation
  return true
})

export default router