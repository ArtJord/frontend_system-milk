<script setup>
import { ref, onMounted, computed } from "vue";
import http from "@/lib/http";

const users = ref([]);
const loading = ref(false);
const error = ref("");
const showPwd = ref(false);

// ---- Modal "Novo Usuário" ----
const showCreate = ref(false);
const saving = ref(false);
const createMsg = ref({ type: "", text: "" });
const cargos = ["gerente", "administrador", "funcionario"];

const form = ref({
  nome: "",
  email: "",
  senha: "",
  cargo: "funcionario",
});

const emailOk = computed(() => /.+@.+\..+/.test(form.value.email));
const senhaOk = computed(() => form.value.senha.length >= 6);
const nomeOk = computed(() => form.value.nome.trim().length >= 2);
const formOk = computed(() => emailOk.value && senhaOk.value && nomeOk.value);

function onEditUser(u) {
  if (!canManageUsers.value) return;
  // futuramente: abrir modal de edição
  console.log("editar usuário", u);
}

function onToggleActive(u) {
  if (!canManageUsers.value) return;
  // futuramente: chamada para ativar/desativar
  console.log("ativar/desativar usuário", u);
}

function onDeleteUser(u) {
  if (!canManageUsers.value) return;
  // futuramente: chamada para deletar
  console.log("excluir usuário", u);
}

function getUserRole() {
  const s =
    localStorage.getItem("user_cargo") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("cargo");
  return s ? String(s).toLowerCase() : "usuario";
}
const userRole = ref(getUserRole());
const canCreateUser = computed(() =>
  ["gerente", "administrador"].includes(userRole.value)
);
const canManageUsers = computed(() =>
  ["gerente", "administrador"].includes(userRole.value)
);

const canChangeRole = computed(() => {
  const r = getUserRole();
  return r === "gerente" || r === "administrador";
});

function openCreate() {
  if (!canCreateUser.value) {
    createMsg.value = {
      type: "error",
      text: "Apenas gerente/administrador podem criar usuários.",
    };
    return;
  }
  createMsg.value = { type: "", text: "" };
  form.value = { nome: "", email: "", senha: "", cargo: "funcionario" };
  showCreate.value = true;
}

function closeCreate() {
  if (saving.value) return;
  showCreate.value = false;
}

async function submitCreate() {
  if (!formOk.value || saving.value) return;
  saving.value = true;
  createMsg.value = { type: "", text: "" };
  try {
    // backend espera: nome, email, senha, cargo
    await http.post("/usuario", {
      nome: form.value.nome.trim(),
      email: form.value.email.trim(),
      senha: form.value.senha,
      cargo: form.value.cargo,
    });
    createMsg.value = { type: "success", text: "Usuário criado com sucesso." };
    // recarrega a lista e fecha modal
    await loadUsers();
    showCreate.value = false;
  } catch (e) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message || e?.userMessage || e?.message;
    createMsg.value = {
      type: "error",
      text:
        status === 403
          ? "Acesso negado. Somente gerente/administrador pode criar usuários."
          : msg || "Não foi possível criar o usuário.",
    };
  } finally {
    saving.value = false;
  }
}

// ---- Lista ----
async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await http.get("/usuarios");
    users.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.userMessage || "Não foi possível carregar usuários.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadUsers);
</script>

<template>
  <div class="w-full">
    <!-- Cabeçalho -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Gerenciar Usuários</h2>
        <p class="text-slate-500 mt-1">Gerencie contas de usuários e permissões</p>
      </div>

      <!-- Botão "Novo Usuário" (só gerente/administrador) -->
      <button
        v-if="canCreateUser"
        @click="openCreate"
        class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2"
        title="Criar novo usuário"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Novo Usuário
      </button>
    </div>

    <!-- Loading & Error -->
    <div v-if="loading" class="p-6 bg-white rounded-lg shadow-sm text-slate-600">
      Carregando usuários...
    </div>
    <div v-else-if="error" class="p-4 mb-4 rounded bg-red-50 text-red-700">
      {{ error }}
    </div>

    <!-- Lista -->
    <div v-else class="space-y-4">
      <template v-for="u in users" :key="u.id">
        <div
          class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border"
        >
          <!-- Dados do usuário -->
          <div class="flex items-center gap-4">
            <div
              class="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="3" />
              </svg>
            </div>

            <div>
              <div class="flex items-center gap-3">
                <div class="text-lg font-semibold text-slate-800">{{ u.fullName }}</div>
                <div
                  v-if="u.cargo"
                  class="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700"
                >
                  {{ u.cargo }}
                </div>
                <div
                  v-if="u.ativo === 1 || u.ativo === true"
                  class="text-xs px-2 py-1 rounded-full bg-black text-white"
                >
                  Ativo
                </div>
                <div
                  v-else
                  class="text-xs px-2 py-1 rounded-full bg-gray-200 text-slate-700"
                >
                  Inativo
                </div>
              </div>

              <div class="text-sm text-slate-500 mt-1">{{ u.email }}</div>
              <div class="text-xs text-slate-400 mt-1">
                Último login: {{ u.ultimoLogin || "N/A" }} | Criado em:
                {{ u.criadoEm || "N/A" }}
              </div>
            </div>
          </div>

          <!-- Ações (só gerente/administrador) -->
          <div class="flex items-center gap-3" v-if="canManageUsers">
            <button
              @click="onEditUser(u)"
              title="Editar"
              class="p-2 rounded border hover:bg-slate-50"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>

            <button
              @click="onToggleActive(u)"
              :class="
                u.ativo === 1 || u.ativo === true
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-black text-white hover:opacity-90'
              "
              class="px-3 py-2 rounded flex items-center gap-2"
              title="Ativar/Desativar"
            >
              <svg
                v-if="u.ativo === 1 || u.ativo === true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              >
                <path d="M18 6L6 18" />
              </svg>
              <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              >
                <path d="M6 12h12" />
              </svg>
              {{ u.ativo === 1 || u.ativo === true ? "Desativar" : "Ativar" }}
            </button>

            <button
              @click="onDeleteUser(u)"
              title="Excluir"
              class="p-2 rounded bg-red-500 hover:bg-red-600 text-white"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              >
                <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>

          <!-- Mensagem para funcionários (opcional) -->
          <div v-else class="text-xs text-slate-500">Sem permissões de gerenciamento</div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-if="!users.length" class="p-6 bg-white rounded-lg shadow-sm text-slate-600">
        Nenhum usuário encontrado.
      </div>
    </div>

    <!-- Modal Novo Usuário -->
    <div v-if="showCreate" class="fixed inset-0 z-50 grid place-items-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40" @click="closeCreate" />

      <!-- Card -->
      <div
        class="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 grid place-items-center rounded-full bg-emerald-100 text-emerald-700"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-slate-900">Novo Usuário</h3>
              <p class="text-sm text-slate-500">
                Preencha os dados para criar um novo usuário.
              </p>
            </div>
          </div>
          <button
            @click="closeCreate"
            class="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-5">
          <div
            v-if="createMsg.text"
            :class="createMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'"
          >
            {{ createMsg.text }}
          </div>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-slate-700">Nome completo</label>
            <input
              v-model.trim="form.nome"
              type="text"
              placeholder="Nome e sobrenome"
              class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p v-if="form.nome && !nomeOk" class="mt-1 text-xs text-red-600">
              Informe ao menos 2 caracteres.
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700">Email</label>
            <input
              v-model.trim="form.email"
              type="email"
              placeholder="email@exemplo.com"
              class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p v-if="form.email && !emailOk" class="mt-1 text-xs text-red-600">
              Email inválido.
            </p>
          </div>

          <!-- Senha + Cargo -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Senha -->
            <div>
              <label class="block text-sm font-medium text-slate-700">Senha</label>
              <div class="mt-2 relative">
                <input
                  :type="showPwd ? 'text' : 'password'"
                  v-model="form.senha"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  @click="showPwd = !showPwd"
                  aria-label="Mostrar/ocultar senha"
                >
                  <svg
                    v-if="!showPwd"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.28 20.28 0 0 1 5.06-5.94"
                    />
                    <path d="M1 1l22 22" />
                  </svg>
                </button>
              </div>
              <p v-if="form.senha && !senhaOk" class="mt-1 text-xs text-red-600">
                Mínimo de 6 caracteres.
              </p>
            </div>

            <!-- Cargo -->
            <div>
              <label class="block text-sm font-medium text-slate-700">Cargo</label>

              <!-- Se pode alterar cargo: botões pill -->
              <div v-if="canChangeRole" class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="c in cargos"
                  :key="c"
                  type="button"
                  @click="form.cargo = c"
                  class="rounded-xl border min-w-[120px] px-4 py-2.5 text-sm font-medium transition text-center capitalize"
                  :class="
                    form.cargo === c
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                  "
                >
                  {{ c }}
                </button>
              </div>

              <!-- Se NÃO pode alterar: somente mostra -->
              <div v-else class="mt-2">
                <div
                  class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                  {{ form.cargo }}
                </div>
                <p class="mt-1 text-xs text-slate-500">
                  Apenas gerente/administrador podem alterar o cargo.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <button
            class="px-4 py-2 rounded-lg border hover:bg-slate-50"
            @click="closeCreate"
            :disabled="saving"
          >
            Cancelar
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white font-medium px-5 py-2.5 hover:bg-emerald-700 disabled:opacity-50"
            :disabled="!formOk || saving"
            @click="submitCreate"
          >
            <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
