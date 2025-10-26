<script setup>
import { ref, onMounted, computed } from 'vue'
import http from '@/lib/http'

const users = ref([])
const loading = ref(false)
const error = ref('')

// ---- Modal "Novo Usuário" ----
const showCreate = ref(false)
const saving = ref(false)
const createMsg = ref({ type: '', text: '' })
const cargos = ['gerente', 'administrador', 'funcionario']

const form = ref({
  nome: '',
  email: '',
  senha: '',
  cargo: 'funcionario',
})

const emailOk = computed(() => /.+@.+\..+/.test(form.value.email))
const senhaOk = computed(() => form.value.senha.length >= 6)
const nomeOk  = computed(() => form.value.nome.trim().length >= 2)
const formOk  = computed(() => emailOk.value && senhaOk.value && nomeOk.value)

function openCreate() {
  createMsg.value = { type: '', text: '' }
  form.value = { nome: '', email: '', senha: '', cargo: 'funcionario' }
  showCreate.value = true
}
function closeCreate() {
  if (saving.value) return
  showCreate.value = false
}

async function submitCreate() {
  if (!formOk.value || saving.value) return
  saving.value = true
  createMsg.value = { type: '', text: '' }
  try {
    // backend espera: nome, email, senha, cargo
    await http.post('/usuario', {
      nome: form.value.nome.trim(),
      email: form.value.email.trim(),
      senha: form.value.senha,
      cargo: form.value.cargo
    })
    createMsg.value = { type: 'success', text: 'Usuário criado com sucesso.' }
    // recarrega a lista e fecha modal
    await loadUsers()
    showCreate.value = false
  } catch (e) {
    createMsg.value = { type: 'error', text: e?.userMessage || 'Não foi possível criar o usuário.' }
  } finally {
    saving.value = false
  }
}

// ---- Lista ----
async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await http.get('/usuarios')
    users.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e?.userMessage || 'Não foi possível carregar usuários.'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

// Placeholders (ações virão depois)
function onEditUser(u) {}
function onToggleActive(u) {}
function onDeleteUser(u) {}
</script>

<template>
  <div class="w-full">
    <!-- Cabeçalho -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Gerenciar Usuários</h2>
        <p class="text-slate-500 mt-1">Gerencie contas de usuários e permissões</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Novo Usuário
      </button>
    </div>

    <div v-if="loading" class="p-6 bg-white rounded-lg shadow-sm text-slate-600">Carregando usuários...</div>
    <div v-if="error" class="p-4 mb-4 rounded bg-red-50 text-red-700">{{ error }}</div>

    <div class="space-y-4" v-if="!loading">
      <template v-for="u in users" :key="u.id">
        <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="3"/>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-3">
                <div class="text-lg font-semibold text-slate-800">{{ u.fullName }}</div>
                <div v-if="u.cargo" class="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700">{{ u.cargo }}</div>
                <div v-if="u.ativo === 1 || u.ativo === true" class="text-xs px-2 py-1 rounded-full bg-black text-white">Ativo</div>
                <div v-else class="text-xs px-2 py-1 rounded-full bg-gray-200 text-slate-700">Inativo</div>
              </div>
              <div class="text-sm text-slate-500 mt-1">{{ u.email }}</div>
              <div class="text-xs text-slate-400 mt-1">
                Último login: {{ u.ultimoLogin || 'N/A' }} | Criado em: {{ u.criadoEm || 'N/A' }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button @click="onEditUser(u)" title="Editar" class="p-2 rounded border hover:bg-slate-50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </button>
            <button
              @click="onToggleActive(u)"
              :class="(u.ativo === 1 || u.ativo === true) ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-black text-white hover:opacity-90'"
              class="px-3 py-2 rounded flex items-center gap-2"
            >
              <svg v-if="u.ativo === 1 || u.ativo === true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M18 6L6 18"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M6 12h12"/>
              </svg>
              {{ (u.ativo === 1 || u.ativo === true) ? 'Desativar' : 'Ativar' }}
            </button>
            <button @click="onDeleteUser(u)" title="Excluir" class="p-2 rounded bg-red-500 hover:bg-red-600 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>
      </template>

      <div v-if="!users.length" class="p-6 bg-white rounded-lg shadow-sm text-slate-600">
        Nenhum usuário encontrado.
      </div>
    </div>

    <!-- Modal Novo Usuário -->
    <div v-if="showCreate" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeCreate" />
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl border">
          <div class="p-5 border-b">
            <h3 class="text-lg font-semibold text-slate-800">Novo Usuário</h3>
            <p class="text-slate-500 text-sm mt-1">Preencha os dados para criar um novo usuário.</p>
          </div>
          <div class="p-5 space-y-4">
            <div v-if="createMsg.text" :class="createMsg.type==='success' ? 'text-emerald-600' : 'text-red-600'">{{ createMsg.text }}</div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <input v-model.trim="form.nome" type="text" class="w-full rounded-lg border-slate-200 focus:border-sky-400 focus:ring-sky-400" placeholder="Nome e sobrenome" />
              <p v-if="form.nome && !nomeOk" class="text-xs text-red-600 mt-1">Informe ao menos 2 caracteres.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input v-model.trim="form.email" type="email" class="w-full rounded-lg border-slate-200 focus:border-sky-400 focus:ring-sky-400" placeholder="email@exemplo.com" />
              <p v-if="form.email && !emailOk" class="text-xs text-red-600 mt-1">Email inválido.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input v-model="form.senha" type="password" class="w-full rounded-lg border-slate-200 focus:border-sky-400 focus:ring-sky-400" placeholder="Mínimo 6 caracteres" />
                <p v-if="form.senha && !senhaOk" class="text-xs text-red-600 mt-1">Mínimo de 6 caracteres.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <select v-model="form.cargo" class="w-full rounded-lg border-slate-200 focus:border-sky-400 focus:ring-sky-400">
                  <option v-for="c in cargos" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="p-5 border-t flex items-center justify-end gap-3">
            <button class="px-4 py-2 rounded-lg border hover:bg-slate-50" @click="closeCreate" :disabled="saving">Cancelar</button>
            <button
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-50"
              :disabled="!formOk || saving"
              @click="submitCreate"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              <span v-else>Salvar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- /Modal -->
  </div>
</template>
