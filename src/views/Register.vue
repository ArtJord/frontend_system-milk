<template>
  <div class="min-h-screen relative flex items-center justify-center p-4">
    <!-- Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200">
      <div class="absolute inset-0 bg-black/40" />
    </div>

     <!-- Card -->
    <div class="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl">
      <div class="text-center space-y-4 px-6 pt-6">
        <div class="flex justify-center">
          <div class="p-3 bg-green-100 rounded-full">
            <Milk class="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p class="text-sm text-gray-600">Preencha seus dados para começar</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 pb-6 pt-4 space-y-4">
        <!-- Nome -->
        <div class="space-y-2">
          <label for="nome" class="text-gray-700 text-sm font-medium">Nome Completo</label>
          <input id="nome" type="text" v-model.trim="form.nome" placeholder="Seu nome completo"
                 class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                 required autocomplete="name" />
          <p v-if="errors.nome" class="text-sm text-red-600">{{ errors.nome }}</p>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label for="email" class="text-gray-700 text-sm font-medium">Email</label>
          <input id="email" type="email" v-model.trim="form.email" placeholder="seu@email.com"
                 class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                 required autocomplete="email" />
          <p v-if="errors.email" class="text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <!-- Senha -->
        <div class="space-y-2">
          <label for="senha" class="text-gray-700 text-sm font-medium">Senha</label>
          <div class="relative">
            <input id="senha" :type="showPassword ? 'text' : 'password'" v-model="form.senha" placeholder="Digite sua senha"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                   required autocomplete="new-password" />
            <button type="button" class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    @click="showPassword = !showPassword" aria-label="Alternar visibilidade da senha">
              <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <p v-if="errors.senha" class="text-sm text-red-600">{{ errors.senha }}</p>
        </div>

       <!-- Confirmar senha -->
        <div class="space-y-2">
          <label for="confirmarSenha" class="text-gray-700 text-sm font-medium">Confirmar Senha</label>
          <div class="relative">
            <input id="confirmarSenha" :type="showConfirm ? 'text' : 'password'" v-model="form.confirmarSenha" placeholder="Repita sua senha"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                   required autocomplete="new-password" />
            <button type="button" class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    @click="showConfirm = !showConfirm" aria-label="Alternar visibilidade da confirmação">
              <component :is="showConfirm ? EyeOff : Eye" class="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <p v-if="errors.confirmarSenha" class="text-sm text-red-600">{{ errors.confirmarSenha }}</p>
        </div>

        <!-- Cargo (travado) -->
        <div class="space-y-2">
          <label class="text-gray-700 text-sm font-medium">Cargo</label>
          <select class="w-full rounded-md border border-gray-300 px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed" disabled>
            <option value="funcionario" selected>Funcionário</option>
          </select>
          <p class="text-xs text-slate-400">Cargos elevados só podem ser criados por um gerente dentro do sistema.</p>
        </div>

        <!-- Erro geral -->
        <div v-if="apiError" class="p-3 rounded-md border border-red-300 bg-red-50 text-sm text-red-700">
          {{ apiError }}
        </div>

        <!-- Botão -->
        <button type="submit" :disabled="loading"
                class="w-full inline-flex items-center justify-center rounded-md bg-green-600 text-white font-medium px-4 py-2 hover:bg-green-700 transition disabled:opacity-60">
          <span v-if="!loading">Criar conta</span>
          <span v-else>Criando...</span>
        </button>

        <!-- Link de voltar -->
        <div class="mt-2 text-center">
          <RouterLink to="/login" class="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium hover:underline">
            <ArrowLeft class="h-4 w-4 mr-1" />
            Voltar ao login
          </RouterLink>
        </div>
      </form>
    </div>

    <!-- Modal de sucesso -->
    <div v-if="successOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" />
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl border p-6 text-center">
          <div class="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-800">Cadastro realizado!</h3>
          <p class="text-slate-600 mt-1">Agora é só fazer login com o email e a senha que você criou.</p>
          <div class="mt-5 flex justify-center">
            <button @click="goToLogin"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white font-medium px-4 py-2 hover:bg-emerald-700">
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter, RouterLink } from "vue-router";
import http from "@/lib/http";
import { Milk, Eye, EyeOff, ArrowLeft } from "lucide-vue-next";

const router = useRouter()

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: ''
})

const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const apiError = ref('')
const errors = reactive({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: ''
})

const successOpen = ref(false)

function validate() {
  errors.nome = errors.email = errors.senha = errors.confirmarSenha = ''

  if (!form.nome || form.nome.trim().length < 2) errors.nome = 'Informe seu nome completo.'
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  if (!emailOk) errors.email = 'Email inválido.'
  if (!form.senha || form.senha.length < 6)
    errors.senha = 'A senha deve ter ao menos 6 caracteres.'
  if (form.confirmarSenha !== form.senha)
    errors.confirmarSenha = 'As senhas não conferem.'

  return !errors.nome && !errors.email && !errors.senha && !errors.confirmarSenha
}

async function onSubmit() {
  apiError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await http.post('/register', {
      nome: form.nome,
      email: form.email,
      senha: form.senha
      
    })
    
    successOpen.value = true
  } catch (e) {
    apiError.value = e?.response?.data?.message || 'Erro ao criar usuário.'
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  successOpen.value = false
  router.replace('/login') 
}

</script>
