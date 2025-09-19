<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/lib/http'
import { Milk, Eye, EyeOff } from 'lucide-vue-next'
import { setToken, getToken, clearToken } from '@/lib/auth'

const route = useRoute()
const router = useRouter()

const showPassword = ref(false)
const email = ref('')
const senha = ref('')

const carregando = ref(false)
const erro = ref('')
const token = ref('')

async function handleLogin (e) {
  e?.preventDefault?.()
  erro.value = ''
  token.value = ''
  carregando.value = true
  try {
    const r = await http.post('/login', { email: email.value.trim(), senha: senha.value })
    token.value = r.data?.token || r.data?.jwt || ''
    if (!token.value) throw new Error('Login não retornou token')

    localStorage.setItem('auth_token', token.value)
    setToken(token.value)

    // volta para a rota que tentou acessar, senão dashboard
    const target = route.query?.r ? String(route.query.r) : '/dashboard'
    await router.replace(target)
  } catch (e) {
    erro.value = e?.response?.data?.message || e.message || 'Erro no login'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen relative flex items-center justify-center p-4">
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url('/placeholder.svg?height=1080&width=1920&text=Campo+com+Vacas+Pastando')` }"
    >
      <div class="absolute inset-0 bg-black/40"></div>
    </div>

    <div class="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl">
      <div class="text-center space-y-4 px-8 pt-8">
        <div class="flex justify-center">
          <div class="p-3 bg-green-100 rounded-full">
            <Milk class="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Sistema Leiteria</h2>
          <p class="text-gray-600">Faça login para acessar o sistema</p>
        </div>
      </div>

      <form class="px-8 pt-6 pb-8 space-y-4" @submit="handleLogin">
        <div class="space-y-2">
          <label for="email" class="text-gray-700 block">Email</label>
          <input id="email" type="email" v-model="email" required class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-green-500/30" />
        </div>

        <div class="space-y-2">
          <label for="senha" class="text-gray-700 block">Senha</label>
          <div class="relative">
            <input :type="showPassword ? 'text' : 'password'" id="senha" v-model="senha" required class="w-full rounded-md border px-3 py-2 pr-10 focus:ring-2 focus:ring-green-500/30" />
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" class="h-5 w-5 text-gray-600" />
              <EyeOff v-else class="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <button type="submit" :disabled="carregando" class="w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2 font-medium disabled:opacity-60">
          {{ carregando ? 'Entrando...' : 'Entrar' }}
        </button>

        <p v-if="erro" class="text-red-600 text-sm mt-2">❌ {{ erro }}</p>
        <p v-if="token" class="text-green-700 text-sm break-all mt-2">Token: {{ token }}</p>

        <div class="mt-2 text-center">
          <p class="text-sm text-gray-600">
            Não tem uma conta?
            <router-link to="/register" class="text-green-600 hover:underline">Criar conta</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
