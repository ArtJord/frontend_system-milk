// src/lib/http.js
import axios from 'axios'
import router from '@/router'
import { getToken, clearToken } from '@/lib/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const t = getToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status
    if (status === 401) {
      const isOnLogin = router.currentRoute.value.path === '/login'
      clearToken()
      if (!isOnLogin) {
        await router.replace({ path: '/login', query: { r: router.currentRoute.value.fullPath } })
      }
    }
    return Promise.reject(err)
  }
)

export default http







 
