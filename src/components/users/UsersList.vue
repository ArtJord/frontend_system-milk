<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import http from "@/lib/http";

const showCreate = ref(false);
const showEdit = ref(false);
const users = ref([]);
const loading = ref(false);
const error = ref("");
const showPwd = ref(false);
const emit = defineEmits(["me-updated"]);

const savingEdit = ref(false);
const editMsg = ref({ type: "", text: "" });
const editingUser = ref(null);

const ME_CACHE_KEY = (id) => `me_profile_cache_v1_${id}`;
function writeMeCache(id, profile) {
  try { localStorage.setItem(ME_CACHE_KEY(id), JSON.stringify(profile)); } catch {}
}

const editSuccess = ref({
  open: false,
  title: "Alterações salvas",
  text: "Usuário atualizado com sucesso.",
});

function closeEditSuccess() {
  editSuccess.value.open = false;
  savingEdit.value = false;
  closeEdit();
}

onBeforeUnmount(() => lockBodyScroll(false));

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

function toUF(v) {
  return String(v || "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase();
}
function formatCEP(v) {
  const n = String(v || "")
    .replace(/\D/g, "")
    .slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
}
function maskPhone(v) {
  const d = String(v || "")
    .replace(/\D/g, "")
    .slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

const me = ref({ id: null, cargo: userRole.value });

async function loadMeQuick() {
  try {
    const { data } = await http.get("/me");
   const cargo = (data.cargo || data.role || "").toLowerCase();
   me.value = {
     id: data.id,
     cargo,
     nome: data.nome || data.fullName || data.name || "",
     email: data.email || "",
     telefone: data.telefone || data.phone || "",
     cep: data.cep || data.zip || "",
     endereco: data.endereco || data.address || "",
     cidade: data.cidade || data.city || "",
     estado: data.estado || data.uf || data.state || "",
   };

   
   userRole.value = cargo;

  
   try {
     localStorage.setItem("user_cargo", cargo);
     localStorage.setItem("user_role", cargo);
     localStorage.setItem("cargo", cargo);
   } catch {}
    

   
    localStorage.setItem("me_profile", JSON.stringify(me.value));
  } catch {
  }
  }


onMounted(loadMeQuick);

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

function lockBodyScroll(lock) {
  const val = lock ? "hidden" : "";
  document.documentElement.style.overflow = val;
  document.body.style.overflow = val;
}

watch([showEdit, showCreate], ([editOpen, createOpen]) => {
  const anyOpen = !!(editOpen || createOpen);
  lockBodyScroll(anyOpen);
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
    await http.post("/usuario", {
      nome: form.value.nome.trim(),
      email: form.value.email.trim(),
      senha: form.value.senha,
      cargo: form.value.cargo,
    });
    createMsg.value = { type: "success", text: "Usuário criado com sucesso." };
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

const editForm = ref({
  nome: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  cidade: "",
  estado: "",
  cargo: "funcionario",
  ativo: 1,
});

const emailOkEdit = computed(() => /.+@.+\..+/.test(editForm.value.email));
const cepOkEdit = computed(() => {
  const c = String(editForm.value.cep || "").trim();
  if (!c) return true;
  return /^\d{5}-\d{3}$/.test(c);
});
const ufOkEdit = computed(() => {
  const uf = String(editForm.value.estado || "");
  if (!uf) return true;
  return /^[A-Z]{2}$/.test(uf);
});
const telefoneOkEdit = computed(() => {
  const t = String(editForm.value.telefone || "").trim();
  if (!t) return true;
  return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(t);
});
const formOkEdit = computed(
  () =>
    !!editForm.value.nome &&
    emailOkEdit.value &&
    cepOkEdit.value &&
    ufOkEdit.value &&
    telefoneOkEdit.value
);

async function openEdit(u) {
  if (!u || !canManageUsers.value) return;
  editingUser.value = u;
  editMsg.value = { type: "", text: "" };

  try {
    const { data: det } = await http.get(`/usuario/${u.id}`); 
    const filled = {
      nome: (det.nome || det.fullName || ""),
      email: det.email || "",
      telefone: maskPhone(det.telefone || ""),
      cep: formatCEP(det.cep || ""),
      endereco: det.endereco || "",
      cidade: det.cidade || "",
      estado: toUF(det.estado || ""),
      cargo: (det.cargo || u.cargo || "funcionario").toLowerCase(),
      ativo: (det.ativo === 1 || det.ativo === true) ? 1 : 0,
    };
    editForm.value = filled;
    showEdit.value = true;
  } catch (e) {
    
    editForm.value = {
      nome: u.fullName || u.nome || "",
      email: u.email || "",
      telefone: maskPhone(u.telefone || ""),
      cep: formatCEP(u.cep || ""),
      endereco: u.endereco || "",
      cidade: u.cidade || "",
      estado: toUF(u.estado || ""),
      cargo: (u.cargo || "funcionario").toLowerCase(),
      ativo: u.ativo === 1 || u.ativo === true ? 1 : 0,
    };
    showEdit.value = true;
  }
}
  
function closeEdit() {
  if (savingEdit.value) return;
  showEdit.value = false;
  editingUser.value = null;
}

async function submitEdit() {
  if (!formOkEdit.value || !editingUser.value) return;

  if (
    editingUser.value.id === me.value.id &&
    editForm.value.cargo === "funcionario" &&
    (me.value.cargo === "gerente" || me.value.cargo === "administrador")
  ) {
    editMsg.value = {
      type: "error",
      text: "Você não pode rebaixar o próprio cargo para 'funcionário'.",
    };
    return;
  }

  savingEdit.value = true;
  editMsg.value = { type: "", text: "" };

  try {
    const payload = {
      nome:  editForm.value.nome.trim(),
      email: editForm.value.email.trim(),

      telefone: maskPhone(editForm.value.telefone).trim() || null,
      cep:      formatCEP(editForm.value.cep) || null,
      endereco: editForm.value.endereco?.trim() || null,
      cidade:   editForm.value.cidade?.trim() || null,
      estado:   toUF(editForm.value.estado) || null,

      cargo: editForm.value.cargo,
    
      ativo: editForm.value.ativo ? 1 : 0,
    };

    await http.patch(`/usuario/${editingUser.value.id}`, payload);

    const ix = users.value.findIndex((x) => x.id === editingUser.value.id);
    if (ix >= 0) {
      users.value[ix] = {
        ...users.value[ix],
        fullName: payload.nome,
        email:    payload.email,
        telefone: payload.telefone ?? "",
        cep:      payload.cep ?? "",
        endereco: payload.endereco ?? "",
        cidade:   payload.cidade ?? "",
        estado:   payload.estado ?? "",
        cargo:    (payload.cargo || "funcionario").toLowerCase(),
        ativo:    payload.ativo,
      };
    }

    if (editingUser.value.id === me.value.id) {
      const snapshot = {
        fullName: payload.nome,
        email:    payload.email,
        telefone: payload.telefone,
        endereco: payload.endereco,
        cidade:   payload.cidade,
        estado:   payload.estado,
        cep:      payload.cep,
      };
      writeMeCache(me.value.id, snapshot);

      me.value.cargo = (payload.cargo || "").toLowerCase();
      userRole.value = me.value.cargo;
      try {
        localStorage.setItem("user_cargo", me.value.cargo);
        localStorage.setItem("user_role",  me.value.cargo);
        localStorage.setItem("cargo",      me.value.cargo);
      } catch {}

      emit("me-updated");
    }

    editMsg.value = { type: "", text: "" };
    savingEdit.value = false;

    await loadUsers();

    editSuccess.value = {
      open: true,
      title: "Tudo certo!",
      text: "Usuário atualizado com sucesso.",
    };
  } catch (e) {
    editMsg.value = {
      type: "error",
      text:
        e?.response?.data?.message ||
        e?.userMessage ||
        "Não foi possível salvar as alterações.",
    };
  } finally {
    if (savingEdit.value) savingEdit.value = false;
  }
}


async function onToggleActive(u) {
  if (!canManageUsers.value) return;
  try {
    const novo = u.ativo === 1 || u.ativo === true ? 0 : 1;
    await http.patch(`/usuario/${u.id}`, { ativo: novo });
    u.ativo = novo;
  } catch (e) {
    alert(e?.response?.data?.message || "Falha ao alterar status.");
  }
}

function onDeleteUser(u) {
  if (!canManageUsers.value) return;
  console.log("excluir usuário", u);
}

async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await http.get("/usuarios");

    users.value = (Array.isArray(data) ? data : []).map((u) => ({
      ...u,
      id: u.id,
      fullName: u.fullName || u.nome || u.name || "",
      nome: u.nome || u.fullName || u.name || "",
      email: u.email || u.mail || "",
      telefone: u.telefone || u.phone || u.celular || "",
      cep: u.cep || u.zip || "",
      endereco: u.endereco || u.address || "",
      cidade: u.cidade || u.city || "",
      estado: u.estado || u.uf || u.state || "",
      cargo: (u.cargo || u.role || "funcionario").toLowerCase(),
      ativo: u.ativo === 1 || u.ativo === true ? 1 : 0,
      criadoEm: u.criadoEm || u.createdAt || u.created_at || "",
      ultimoLogin: u.ultimoLogin || u.lastLogin || u.last_login || "",
    }));
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
          <!-- Dados -->
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

          <!-- Ações -->
          <div class="flex items-center gap-3" v-if="canManageUsers">
            <button
              @click="openEdit(u)"
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
          <div v-else class="text-xs text-slate-500">Sem permissões de gerenciamento</div>
        </div>
      </template>

      <div v-if="!users.length" class="p-6 bg-white rounded-lg shadow-sm text-slate-600">
        Nenhum usuário encontrado.
      </div>
    </div>

    <!-- ================== MODAL: NOVO USUÁRIO ================== -->
    <div v-if="showCreate" class="fixed inset-0 z-50 grid place-items-center">
      <div class="absolute inset-0 bg-black/40" @click="closeCreate" />
      <div
        class="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col overflow-hidden overscroll-contain"
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
        <div class="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
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

            <div>
              <label class="block text-sm font-medium text-slate-700">Cargo</label>
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
        <div
          class="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white shrink-0"
        >
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

    <!-- ================== MODAL: EDITAR USUÁRIO ================== -->
    <div
      v-if="showEdit"
      class="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
    >
      <div class="absolute inset-0 bg-black/40" @click="closeEdit"></div>

      <div
        class="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col overflow-hidden overscroll-contain"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 grid place-items-center rounded-full bg-sky-100 text-sky-700"
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
              <h3 class="text-xl font-semibold text-slate-900">Editar usuário</h3>
              <p class="text-sm text-slate-500">Atualize os dados e permissões</p>
            </div>
          </div>
          <button
            @click="closeEdit"
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
        <div class="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700">Nome</label>
              <input
                v-model.trim="editForm.nome"
                type="text"
                placeholder="Nome completo"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">Email</label>
              <input
                v-model.trim="editForm.email"
                type="email"
                placeholder="email@exemplo.com"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              <p v-if="editForm.email && !emailOkEdit" class="mt-1 text-xs text-red-600">
                Email inválido.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">Telefone</label>
              <input
                v-model.trim="editForm.telefone"
                @blur="editForm.telefone = maskPhone(editForm.telefone)"
                type="text"
                placeholder="Ex: (67) 99999-9999"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              <p
                v-if="editForm.telefone && !telefoneOkEdit"
                class="mt-1 text-xs text-red-600"
              >
                Telefone inválido.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">CEP</label>
              <input
                v-model="editForm.cep"
                @blur="editForm.cep = formatCEP(editForm.cep)"
                type="text"
                placeholder="Ex: 79800-000"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              <p v-if="editForm.cep && !cepOkEdit" class="mt-1 text-xs text-red-600">
                CEP inválido.
              </p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700">Endereço</label>
              <input
                v-model.trim="editForm.endereco"
                type="text"
                placeholder="Ex: Rua Monte Alegre, 1519"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">Cidade</label>
              <input
                v-model.trim="editForm.cidade"
                type="text"
                placeholder="Ex: Dourados"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">Estado (UF)</label>
              <input
                v-model="editForm.estado"
                maxlength="2"
                @input="editForm.estado = toUF(editForm.estado)"
                type="text"
                placeholder="Ex: MS"
                class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 uppercase"
              />
              <p v-if="editForm.estado && !ufOkEdit" class="mt-1 text-xs text-red-600">
                Informe 2 letras (UF).
              </p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700">Cargo</label>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="c in cargos"
                  :key="c"
                  type="button"
                  @click="editForm.cargo = c"
                  class="rounded-xl border min-w-[120px] px-4 py-2.5 text-sm font-medium transition text-center capitalize"
                  :class="
                    editForm.cargo === c
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                  "
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700">Status</label>
              <label class="mt-2 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="editForm.ativo"
                  :true-value="1"
                  :false-value="0"
                  class="accent-emerald-600"
                />
                <span class="text-sm text-slate-700">Usuário ativo</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white shrink-0"
        >
          <button
            class="px-4 py-2 rounded-lg border hover:bg-slate-50"
            @click="closeEdit"
            :disabled="savingEdit"
          >
            Cancelar
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-sky-600 text-white font-medium px-5 py-2.5 hover:bg-sky-700 disabled:opacity-50"
            :disabled="!formOkEdit || savingEdit"
            @click="submitEdit"
          >
            <svg v-if="savingEdit" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
        <!-- Footer -->
      </div>
    </div>
  </div>

  <!-- ✅ POPUP DE SUCESSO -->
  <transition name="fade">
    <div v-if="editSuccess.open" class="fixed inset-0 z-[60] grid place-items-center">
      <!-- backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        @click="closeEditSuccess"
      ></div>

      <!-- card -->
      <div
        class="relative w-[min(92vw,44rem)] rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-success-title"
      >
        <div class="flex items-start gap-4">
          <div
            class="h-12 w-12 shrink-0 rounded-2xl grid place-items-center bg-emerald-100 text-emerald-700"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M20 6L9 17l-5-5" stroke-width="2" />
            </svg>
          </div>

          <div class="flex-1">
            <h3
              id="edit-success-title"
              class="text-xl sm:text-2xl font-semibold text-slate-900"
            >
              {{ editSuccess.title }}
            </h3>
            <p class="text-slate-600 mt-2 text-base leading-relaxed">
              {{ editSuccess.text }}
            </p>
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <button
            @click="closeEditSuccess"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 font-medium hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
