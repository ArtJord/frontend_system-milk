import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import AppShell from '@/layouts/AppShell.vue'
import Dashboard from '@/views/Dashboard.vue'
import Animais from '@/views/Animais.vue'



import { getToken, clearToken } from '@/lib/auth'

// placeholders para não quebrar o menu
const LeitePlaceholder = { template: '<div>Leite (em breve)</div>' }
const Lucros = { template: '<div>Lucros (em breve)</div>' }
const Despesas = { template: '<div>Despesas (em breve)</div>' }
const Relatorios = { template: '<div>Relatórios (em breve)</div>' }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true, title: 'Login' } },
    { path: '/register', component: () => import('@/views/Register.vue'), meta: { public: true, title: 'Registro' } },
    {
      path: '/',
      component: () => import('@/layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: 'Dashboard' } },
        { path: 'animais', component: () => import('@/views/Animais.vue'), meta: { title: 'Animais' } },
        { path: 'leite', component: () => import('@/views/Leite.vue'), meta: { title: 'Leite' } },
        { path: 'lucros', component: () => import('@/views/Lucro.vue'), meta: { title: 'Lucro' } },
        { path: '/configuracoes', component: () => import('@/views/Settings.vue'), meta: { title: 'Configurações' } },
        { path: 'despesas', component: () => import('@/views/Despesa.vue'), meta: { title: 'Despesas' } },
      ],
    },

    { path: '/:pathMatch(.*)*', component: { template: '<div class="p-6">404</div>' }, meta: { public: true } },
  ],
})

router.beforeEach((to, from, next) => {

  if (to.meta.public) return next()

  const token = getToken()
  if (!token) {
    return next({ path: '/login', query: { r: to.fullPath } })
  }
  next()
})

export default router