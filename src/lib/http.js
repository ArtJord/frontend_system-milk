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
    err.userMessage = (()=>{
      const s = err?.response?.status;
      const data = err?.response?.data;
      const backendMsg = (data && (data.message || data.erro)) || "";
      if (backendMsg) return backendMsg;
      if (s===0) return "Não foi possível conectar ao servidor. Verifique sua internet.";
      if (s===400) return "Verifique os dados informados e tente novamente.";
      if (s===401) return "Sua sessão expirou. Faça login novamente.";
      if (s===403) return "Você não tem permissão para esta ação.";
      if (s===404) return "Recurso não encontrado.";
      if (s===422) return "Alguns campos são inválidos. Confira e tente de novo.";
      if (s>=500) return "Erro no servidor. Tente novamente mais tarde.";
      return "Não foi possível concluir a operação.";
    })();
    return Promise.reject(err)
  }
)

export default http







 
