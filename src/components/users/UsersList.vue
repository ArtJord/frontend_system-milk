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

const showConfirmStatus = ref(false);
const statusTargetUser = ref(null);
const statusDesired = ref(true); // true = ativar, false = desativar
const statusPassword = ref("");
const statusSaving = ref(false);
const statusError = ref("");

const ME_CACHE_KEY = (id) => `me_profile_cache_v1_${id}`;
function writeMeCache(id, profile) {
  try {
    localStorage.setItem(ME_CACHE_KEY(id), JSON.stringify(profile));
  } catch {}
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
  } catch {}
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
  senhaNova: "",
  senhaConfirma: "",
});

const showPwdEdit = ref({ nova: false, confirma: false });
const showSuccess = ref(false);
const successText = ref("");

const passwordMatchEdit = computed(
  () =>
    !editForm.value.senhaNova || editForm.value.senhaNova === editForm.value.senhaConfirma
);

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
    telefoneOkEdit.value &&
    (!editForm.value.senhaNova ||
      (editForm.value.senhaNova.length >= 6 && passwordMatchEdit.value))
);

async function openEdit(u) {
  if (!u || !canManageUsers.value) return;
  editingUser.value = u;
  editMsg.value = { type: "", text: "" };

  try {
    const { data: det } = await http.get(`/usuario/${u.id}`);
    const filled = {
      nome: det.nome || det.fullName || "",
      email: det.email || "",
      telefone: maskPhone(det.telefone || ""),
      cep: formatCEP(det.cep || ""),
      endereco: det.endereco || "",
      cidade: det.cidade || "",
      estado: toUF(det.estado || ""),
      cargo: (det.cargo || u.cargo || "funcionario").toLowerCase(),
      ativo: det.ativo === 1 || det.ativo === true ? 1 : 0,
    };
    editForm.value = { ...filled, senhaNova: "", senhaConfirma: "" };
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

      senhaNova: "",
      senhaConfirma: "",
    };
    showEdit.value = true;
  }
}

function closeEdit() {
  if (savingEdit.value) return;
  showEdit.value = false;
  editingUser.value = null;
}

function requestToggleAtivo(user) {
  statusTargetUser.value = user;
  const isAtivo = user.ativo === 1 || user.ativo === true;
  statusDesired.value = !isAtivo; // true => ativar, false => desativar
  statusPassword.value = "";
  statusError.value = "";
  showConfirmStatus.value = true;
}

function closeStatusModal() {
  if (statusSaving.value) return;
  showConfirmStatus.value = false;
  statusTargetUser.value = null;
  statusPassword.value = "";
  statusError.value = "";
}

async function confirmToggleAtivo() {
  if (!statusTargetUser.value) return;
  statusSaving.value = true;
  statusError.value = "";

  const id = statusTargetUser.value.id;
  const desired = statusDesired.value ? 1 : 0;

  try {
    const resp = await http.patch(`/usuario/${id}/ativo`, {
      ativo: desired,
      password: statusPassword.value,
    });

    // Atualiza lista local
    const ix = users.value.findIndex((u) => u.id === id);
    if (ix >= 0) {
      users.value[ix] = {
        ...users.value[ix],
        ativo: !!(resp?.data?.ativo ?? desired),
      };
    }

    // Se você editar o próprio status (ativar tudo bem; desativar a si impedimos no backend)
    if (me.value?.id === id) {
      me.value.ativo = !!(resp?.data?.ativo ?? desired);
    }

    closeStatusModal();

    // Feedback simples (se você já tem toast/modal, pode trocar)
    showSuccess.value = true;
    successText.value = statusDesired.value ? "Usuário ativado." : "Usuário desativado.";
  } catch (e) {
    statusError.value =
      e?.response?.data?.error || e?.userMessage || "Falha ao alterar status.";
  } finally {
    statusSaving.value = false;
  }
}

function onSuccessOk() {
  // fecha o popup de sucesso
  showSuccess.value = false;

  // garante que o modal de confirmação fique fechado e limpo
  showConfirmStatus.value = false;
  statusSaving.value = false;
  statusPassword.value = "";
  statusError.value = "";
  statusTargetUser.value = null;
}

async function submitEdit() {
  if (!formOkEdit.value || !editingUser.value) return;

  // trava duplo clique
  savingEdit.value = true;
  editMsg.value = { type: "", text: "" };

  try {
    const id = editingUser.value.id;

    // 1) Payload básico (nome/email/cargo/ativo)
    const payloadBasic = {
      nome: editForm.value.nome.trim(),
      email: editForm.value.email.trim(),
      cargo: editForm.value.cargo,
    };

    await http.patch(`/usuario/${id}`, payloadBasic);

    // 2) Payload de perfil (telefone/endereço/cidade/estado/cep)
    const payloadPerfil = {
      telefone: maskPhone(editForm.value.telefone).trim() || null,
      cep: formatCEP(editForm.value.cep) || null,
      endereco: editForm.value.endereco?.trim() || null,
      cidade: editForm.value.cidade?.trim() || null,
      estado: toUF(editForm.value.estado) || null,
    };

    // Só chama o endpoint de perfil se houver algum desses campos no form (evita chamada desnecessária)
    const temPerfil =
      payloadPerfil.telefone ||
      payloadPerfil.cep ||
      payloadPerfil.endereco ||
      payloadPerfil.cidade ||
      payloadPerfil.estado;

    if (temPerfil) {
      await http.patch(`/usuario/${id}/perfil`, payloadPerfil);
    }

    // Atualiza o array local de usuários (UI imediata)
    const ix = users.value.findIndex((x) => x.id === id);
    if (ix >= 0) {
      users.value[ix] = {
        ...users.value[ix],
        fullName: payloadBasic.nome,
        email: payloadBasic.email,
        telefone: payloadPerfil.telefone ?? users.value[ix].telefone ?? "",
        cep: payloadPerfil.cep ?? users.value[ix].cep ?? "",
        endereco: payloadPerfil.endereco ?? users.value[ix].endereco ?? "",
        cidade: payloadPerfil.cidade ?? users.value[ix].cidade ?? "",
        estado: payloadPerfil.estado ?? users.value[ix].estado ?? "",
        cargo: (payloadBasic.cargo || "funcionario").toLowerCase(),
      };
    }

    // Se o gerente editou a SI próprio perfil, atualiza o cache local do "me" (mesma lógica que você já tem)
    if (id === me.value.id) {
      const snapshot = {
        fullName: payloadBasic.nome,
        email: payloadBasic.email,
        telefone: payloadPerfil.telefone ?? "",
        endereco: payloadPerfil.endereco ?? "",
        cidade: payloadPerfil.cidade ?? "",
        estado: payloadPerfil.estado ?? "",
        cep: payloadPerfil.cep ?? "",
      };
      writeMeCache(me.value.id, snapshot);
      me.value.cargo = (payloadBasic.cargo || "").toLowerCase();
    }

    if (editForm.value.senhaNova) {
      try {
        await http.patch(`/usuario/${id}/password`, {
          newPassword: editForm.value.senhaNova,
        });
      } catch (err) {
        savingEdit.value = false;
        editMsg.value = {
          type: "error",
          text:
            err?.response?.data?.message ||
            err?.userMessage ||
            "Falha ao definir a nova senha do usuário.",
        };
        return; // interrompe aqui para o usuário corrigir
      }
    }

    editMsg.value = { type: "success", text: "Usuário atualizado com sucesso." };
    showSuccess.value = true;
    successText.value = "Usuário atualizado com sucesso.";
    showEdit.value = false;
    editingUser.value = null;
  } catch (e) {
    editMsg.value = {
      type: "error",
      text: e?.userMessage || "Falha ao salvar alterações do usuário.",
    };
  } finally {
    savingEdit.value = false;
    editForm.value.senhaNova = "";
    editForm.value.senhaConfirma = "";
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
              type="button"
              :disabled="savingEdit || statusSaving"
              @click="requestToggleAtivo(u)"
              :class="
                u.ativo === 1 || u.ativo === true
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-black text-white hover:opacity-90'
              "
              class="px-3 py-2 rounded flex items-center gap-2 disabled:opacity-50"
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

            <!-- ======== Definir nova senha (apenas gerente/admin está aqui) ======== -->
            <div class="md:col-span-2">
              <div class="my-4 h-px bg-slate-100"></div>
              <h4 class="text-sm font-semibold text-slate-900">Definir nova senha</h4>
              <p class="text-slate-500 text-xs mt-1">
                Preencha para definir uma nova senha para este usuário (mín. 6
                caracteres).
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">Nova senha</label>
              <div class="mt-2 relative">
                <input
                  :type="showPwdEdit.nova ? 'text' : 'password'"
                  v-model="editForm.senhaNova"
                  placeholder="Nova senha"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  @click="showPwdEdit.nova = !showPwdEdit.nova"
                  aria-label="Mostrar/ocultar senha"
                >
                  <svg
                    v-if="!showPwdEdit.nova"
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
                      d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-7-11-7a20.28 20.28 0 0 1 5.06-5.94"
                    />
                    <path d="M1 1l22 22" />
                  </svg>
                </button>
              </div>
              <p
                v-if="editForm.senhaNova && editForm.senhaNova.length < 6"
                class="mt-1 text-xs text-red-600"
              >
                Mínimo de 6 caracteres.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700"
                >Confirmar senha</label
              >
              <div class="mt-2 relative">
                <input
                  :type="showPwdEdit.confirma ? 'text' : 'password'"
                  v-model="editForm.senhaConfirma"
                  placeholder="Confirmar senha"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  @click="showPwdEdit.confirma = !showPwdEdit.confirma"
                  aria-label="Mostrar/ocultar senha"
                >
                  <svg
                    v-if="!showPwdEdit.confirma"
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
                      d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-7-11-7a20.28 20.28 0 0 1 5.06-5.94"
                    />
                    <path d="M1 1l22 22" />
                  </svg>
                </button>
              </div>
              <p v-if="!passwordMatchEdit" class="mt-1 text-xs text-red-600">
                As senhas não coincidem.
              </p>
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
                  disabled
                />
                <span class="text-xs text-slate-500 ml-2">
                  Para alterar, use o botão Ativar/Desativar nas ações.
                </span>
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

  <!-- 🔒 MODAL: confirmar ativação/desativação -->
  <Transition name="fade">
    <div
      v-if="showConfirmStatus"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-2">
          {{ statusDesired ? "Ativar usuário" : "Desativar usuário" }}
        </h3>
        <p class="text-gray-600 mb-4">
          Confirme sua senha para {{ statusDesired ? "ativar" : "desativar" }}
          <strong>{{ statusTargetUser?.fullName || "o usuário" }}</strong
          >.
        </p>

        <label class="block text-sm font-medium text-gray-700 mb-1">Sua senha</label>
        <input
          type="password"
          v-model="statusPassword"
          class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring"
          placeholder="Digite sua senha"
        />

        <p v-if="statusError" class="text-red-600 text-sm mb-3">{{ statusError }}</p>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-lg border"
            @click="closeStatusModal"
            :disabled="statusSaving"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
            :disabled="!statusPassword || statusSaving"
            @click="confirmToggleAtivo"
          >
            {{ statusSaving ? "Salvando..." : statusDesired ? "Ativar" : "Desativar" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ✅ POPUP DE SUCESSO -->
  <Transition name="fade">
    <div
      v-if="showSuccess"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="onSuccessOk"
      @keydown.esc="onSuccessOk"
      tabindex="0"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
        <h3 class="text-lg font-semibold mb-2">Alterações salvas ✅</h3>
        <p class="text-gray-600 mb-4">
          {{ successText || "Usuário atualizado com sucesso." }}
        </p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:opacity-90"
          @click="onSuccessOk()"
        >
          OK
        </button>
      </div>
    </div>
  </Transition>
</template>
