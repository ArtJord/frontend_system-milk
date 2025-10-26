<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '@/lib/http'

// estado do usuário
const user = ref({ id: null, fullName: '', email: '' })

// abas
const tab = ref('perfil')

// formulário
const form = ref({
  fullName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const showPwd = ref({ current: false, next: false, confirm: false })
const message = ref({ type: '', text: '' }) // success | error

const isDirty = computed(() =>
  form.value.fullName !== user.value.fullName ||
  form.value.email !== user.value.email ||
  !!form.value.currentPassword ||
  !!form.value.newPassword ||
  !!form.value.confirmPassword
)

const emailValid = computed(() => /.+@.+\..+/.test(form.value.email))
const passwordMatch = computed(() =>
  !form.value.newPassword || form.value.newPassword === form.value.confirmPassword
)
const passwordSectionValid = computed(() => {
  if (form.value.newPassword || form.value.confirmPassword || form.value.currentPassword) {
    return (
      !!form.value.currentPassword &&
      !!form.value.newPassword &&
      !!form.value.confirmPassword &&
      passwordMatch.value
    )
  }
  return true
})

const formValid = computed(() =>
  !!form.value.fullName && emailValid.value && passwordSectionValid.value
)

// componente de ícone local (olho)
const EyeIcon = {
  props: { on: { type: Boolean, default: false } },
  template: `
    <svg v-if="on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.29 20.29 0 0 1 5.06-6.94"/>
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-4.23 5.64"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  `
}

async function loadMe () {
  try {
    const { data } = await http.get('/me') 
    user.value = { id: data.id, fullName: data.fullName, email: data.email }
    Object.assign(form.value, user.value)
  } catch (e) {
  message.value = { type: 'error', text: e?.userMessage || 'Falha ao carregar perfil.' }
}
}

async function saveChanges () {
  if (!formValid.value || !isDirty.value) return
  loading.value = true
  message.value = { type: '', text: '' }
  try {
    const payload = {}
    if (form.value.fullName !== user.value.fullName) payload.fullName = form.value.fullName
    if (form.value.email !== user.value.email) payload.email = form.value.email

    if (form.value.newPassword || form.value.confirmPassword || form.value.currentPassword) {
      payload.currentPassword = form.value.currentPassword
      payload.newPassword = form.value.newPassword
    }

    await http.patch(`/usuario/${user.value.id}`, payload) // ajuste a rota se necessário

    user.value.fullName = form.value.fullName
    user.value.email = form.value.email

    form.value.currentPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''

    message.value = { type: 'success', text: 'Alterações salvas com sucesso.' }
  } catch (e) {
    message.value = { type: 'error', text: e?.userMessage || 'Não foi possível salvar. Tente novamente.' }
  } finally {
    loading.value = false
  }
}

onMounted(loadMe)
</script>

<template>
  <div class="w-full">
    <!-- Cabeçalho -->
    <div class="mb-6">
      <h1 class="text-3xl font-semibold text-slate-800">Configurações</h1>
      <p class="text-slate-500 mt-1">Gerencie as configurações do sistema e usuários</p>
    </div>

    <!-- Tabs (apenas Perfil e Usuários) -->
    <div class="flex gap-2 rounded-xl bg-slate-100 p-1 w-full max-w-xl mb-6">
      <button
        class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
        :class="tab === 'perfil' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'"
        @click="tab = 'perfil'"
      >
        <span class="i-lucide-user" aria-hidden="true" />
        Perfil
      </button>
      <button
        class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
        :class="tab === 'usuarios' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'"
        @click="tab = 'usuarios'"
      >
        <span class="i-lucide-users" aria-hidden="true" />
        Usuários
      </button>
    </div>

    <!-- Conteúdo: Perfil -->
    <section v-if="tab === 'perfil'" class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
      <div class="p-6 border-b border-slate-100">
        <h2 class="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-slate-500"><path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
          Informações do Perfil
        </h2>
        <p class="text-slate-500 mt-1">Atualize suas informações pessoais e senha</p>
      </div>

      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
          <input
            v-model.trim="form.fullName"
            type="text"
            class="w-full rounded-lg border-slate-200 focus:border-sky-400 focus:ring-sky-400"
            placeholder="Seu nome completo"
            autocomplete="name"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            v-model.trim="form.email"
            type="email"
            class="w-full rounded-lg border-slate-200 focus:border-sky-400 focus:ring-sky-400"
            placeholder="seu@email.com"
            autocomplete="email"
          />
          <p v-if="form.email && !emailValid" class="text-xs text-red-600 mt-1">Informe um email válido.</p>
        </div>
      </div>

      <div class="px-6"><hr class="border-slate-100"/></div>

      <div class="p-6">
        <h3 class="text-base font-semibold text-slate-800 mb-4">Alterar Senha</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Senha Atual -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Senha Atual</label>
            <div class="relative">
              <input :type="showPwd.current ? 'text' : 'password'" v-model="form.currentPassword" class="w-full rounded-lg border-slate-200 pr-10 focus:border-sky-400 focus:ring-sky-400" placeholder="Senha atual" autocomplete="current-password" />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500" @click="showPwd.current = !showPwd.current" aria-label="Alternar visibilidade">
                <EyeIcon :on="showPwd.current" />
              </button>
            </div>
          </div>
          <!-- Nova Senha -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
            <div class="relative">
              <input :type="showPwd.next ? 'text' : 'password'" v-model="form.newPassword" class="w-full rounded-lg border-slate-200 pr-10 focus:border-sky-400 focus:ring-sky-400" placeholder="Nova senha" autocomplete="new-password" />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500" @click="showPwd.next = !showPwd.next" aria-label="Alternar visibilidade">
                <EyeIcon :on="showPwd.next" />
              </button>
            </div>
          </div>
          <!-- Confirmar Senha -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
            <div class="relative">
              <input :type="showPwd.confirm ? 'text' : 'password'" v-model="form.confirmPassword" class="w-full rounded-lg border-slate-200 pr-10 focus:border-sky-400 focus:ring-sky-400" placeholder="Confirmar senha" autocomplete="new-password" />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500" @click="showPwd.confirm = !showPwd.confirm" aria-label="Alternar visibilidade">
                <EyeIcon :on="showPwd.confirm" />
              </button>
            </div>
            <p v-if="!passwordMatch" class="text-xs text-red-600 mt-1">As senhas não coincidem.</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <p v-if="message.text" :class="message.type === 'success' ? 'text-emerald-600' : 'text-red-600'" class="text-sm mr-auto">{{ message.text }}</p>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading || !isDirty || !formValid"
            @click="saveChanges"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Salvar Alterações
          </button>
        </div>
      </div>
    </section>

    <!-- Conteúdo: Usuários (placeholder) -->
    <section v-else class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
      <h2 class="text-xl font-semibold text-slate-800 mb-1">Usuários</h2>
      <p class="text-slate-500">Aqui você poderá gerenciar usuários. (Implementação posterior.)</p>
    </section>
  </div>
</template>

<style scoped>
.i-lucide-user::before, .i-lucide-users::before { display: none; }
</style>