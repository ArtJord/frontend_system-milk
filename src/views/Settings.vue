<script setup>
import UsersList from "@/components/users/UsersList.vue";
import { ref, computed, onMounted } from "vue";
import http from "@/lib/http";

const LS_KEY = 'me_profile_cache_v1'

function readProfileCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function writeProfileCache(profile) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(profile)) } catch {}
}

// estado do usuário
const user = ref({
  id: null,
  fullName: "",
  email: "",
  telefone: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
});

// abas
const tab = ref("perfil");

// formulário
const form = ref({
  fullName: "",
  email: "",
  telefone: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const loading = ref(false);
const showPwd = ref({ current: false, next: false, confirm: false });
const message = ref({ type: "", text: "" }); // success | error

/* ========= Helpers de formatação/validação ========= */
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
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

const isDirty = computed(() => {
  return (
    form.value.fullName !== user.value.fullName ||
    form.value.email !== user.value.email ||
    form.value.telefone !== user.value.telefone ||
    form.value.endereco !== user.value.endereco ||
    form.value.cidade !== user.value.cidade ||
    form.value.estado !== user.value.estado ||
    form.value.cep !== user.value.cep ||
    !!form.value.currentPassword ||
    !!form.value.newPassword ||
    !!form.value.confirmPassword
  );
});
const emailValid = computed(() => /.+@.+\..+/.test(form.value.email));
const passwordMatch = computed(
  () => !form.value.newPassword || form.value.newPassword === form.value.confirmPassword
);
const passwordSectionValid = computed(() => {
  if (
    form.value.newPassword ||
    form.value.confirmPassword ||
    form.value.currentPassword
  ) {
    return (
      !!form.value.currentPassword &&
      !!form.value.newPassword &&
      !!form.value.confirmPassword &&
      passwordMatch.value
    );
  }
  return true;
});

const telefoneOk = computed(() => {
  const t = String(form.value.telefone || "").trim();
  if (!t) return true;
  return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(t);
});

const cepOk = computed(() => {
  const c = String(form.value.cep || "").trim();
  if (!c) return true;
  return /^\d{5}-\d{3}$/.test(c);
});

const ufOk = computed(() => {
  const uf = String(form.value.estado || "");
  if (!uf) return true;
  return /^[A-Z]{2}$/.test(uf);
});

const formValid = computed(
  () =>
    !!form.value.fullName &&
    emailValid.value &&
    passwordSectionValid.value &&
    telefoneOk.value &&
    cepOk.value &&
    ufOk.value
);

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
  `,
};

const feedback = ref({
  open: false,
  type: "success", // success | error | info
  title: "",
  text: "",
});

function showFeedback(text, type = "success", title = "Tudo certo!") {
  feedback.value = { open: true, type, title, text };
}
function closeFeedback() {
  feedback.value.open = false;
}

async function loadMe() {
  try {
    const { data } = await http.get("/me");
    const cache = readProfileCache();

    const servidor = {
      id: data.id,
      fullName: data.fullName || data.nome || "",
      email: data.email || "",
      telefone: data.telefone || "",
      endereco: data.endereco || "",
      cidade: data.cidade || "",
      estado: (data.estado || "").toUpperCase(),
      cep: formatCEP(data.cep || ""),
    };

    // Usa o do servidor; se vier vazio, completa com o cache
    const combinado = {
      ...servidor,
      telefone: servidor.telefone || cache.telefone || "",
      endereco: servidor.endereco || cache.endereco || "",
      cidade:   servidor.cidade   || cache.cidade   || "",
      estado:   (servidor.estado || cache.estado || "").toUpperCase(),
      cep:      formatCEP(servidor.cep || cache.cep || ""),
    };

    user.value = combinado;
    Object.assign(form.value, combinado);

    
    writeProfileCache({
      fullName: user.value.fullName,
      email: user.value.email,
      telefone: user.value.telefone,
      endereco: user.value.endereco,
      cidade: user.value.cidade,
      estado: user.value.estado,
      cep: user.value.cep,
    });
  } catch (e) {
    message.value = { type: "error", text: e?.userMessage || "Falha ao carregar perfil." };
  }
}


async function saveChanges() {
  if (!formValid.value || !isDirty.value) return;
  loading.value = true;
  message.value = { type: "", text: "" };

  try {
    const payload = {
      // backend provavelmente espera "nome"
      nome: form.value.fullName, // <-- chave compatível com PHP
      fullName: form.value.fullName, // opcional (para futuro/compat)
      email: form.value.email,
      telefone: maskPhone(form.value.telefone).trim(),
      endereco: form.value.endereco?.trim() || "",
      cidade: form.value.cidade?.trim() || "",
      estado: toUF(form.value.estado),
      cep: formatCEP(form.value.cep),
    };

    if (
      form.value.newPassword ||
      form.value.confirmPassword ||
      form.value.currentPassword
    ) {
      payload.currentPassword = form.value.currentPassword;
      payload.newPassword = form.value.newPassword;
    }

    await http.patch(`/usuario/${user.value.id}`, payload);

// atualiza estados locais…
user.value = {
  ...user.value,
  fullName: payload.nome,
  email: payload.email,
  telefone: payload.telefone,
  endereco: payload.endereco,
  cidade: payload.cidade,
  estado: payload.estado,
  cep: payload.cep,
};
Object.assign(form.value, user.value);

writeProfileCache({
  fullName: user.value.fullName,
  email: user.value.email,
  telefone: user.value.telefone,
  endereco: user.value.endereco,
  cidade: user.value.cidade,
  estado: user.value.estado,
  cep: user.value.cep,
});

    // limpa campos de senha
    form.value.currentPassword = "";
    form.value.newPassword = "";
    form.value.confirmPassword = "";

    showFeedback("Alterações salvas com sucesso.", "success", "Perfil atualizado");
  } catch (e) {
    const txt =
      e?.userMessage ||
      e?.response?.data?.message ||
      "Não foi possível salvar. Tente novamente.";
    showFeedback(txt, "error", "Falha ao salvar");
  } finally {
    loading.value = false;
  }
}

onMounted(loadMe);

function onBlurCEP() {
  form.value.cep = formatCEP(form.value.cep);
}
function onInputUF(e) {
  form.value.estado = toUF(e?.target?.value ?? form.value.estado);
}
function onBlurPhone() {
  form.value.telefone = maskPhone(form.value.telefone);
}
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
        :class="
          tab === 'perfil'
            ? 'bg-white shadow text-slate-900'
            : 'text-slate-600 hover:text-slate-900'
        "
        @click="tab = 'perfil'"
      >
        <span class="i-lucide-user" aria-hidden="true" />
        Perfil
      </button>
      <button
        class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
        :class="
          tab === 'usuarios'
            ? 'bg-white shadow text-slate-900'
            : 'text-slate-600 hover:text-slate-900'
        "
        @click="tab = 'usuarios'"
      >
        <span class="i-lucide-users" aria-hidden="true" />
        Usuários
      </button>
    </div>

    <!-- Conteúdo: Perfil -->
    <section v-if="tab === 'perfil'" class="bg-transparent p-0 space-y-6">
      <!-- Card de título + avatar -->
      <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
        <div class="p-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- Avatar com iniciais -->
            <div
              class="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center text-xl font-semibold"
            >
              {{
                (form.fullName || "US")
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
              }}
            </div>
            <div>
              <h2 class="text-xl font-semibold text-slate-900">Seu perfil</h2>
              <p class="text-slate-500 text-sm">Mantenha seus dados atualizados</p>
            </div>
          </div>

          <!-- Status do formulário -->
          <div class="hidden md:block text-sm">
            <span :class="isDirty ? 'text-amber-600' : 'text-slate-400'">
              {{ isDirty ? "Há alterações não salvas" : "Nenhuma alteração" }}
            </span>
          </div>
        </div>
        <div class="px-6 pb-6">
          <div class="h-px bg-slate-100"></div>
        </div>
      </div>

      <!-- Grid de cards dos campos -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Dados pessoais -->
        <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div class="p-6">
            <h3 class="text-base font-semibold text-slate-900">Dados pessoais</h3>
            <p class="text-slate-500 text-sm mt-1">Nome, e-mail e senha</p>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Nome -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nome Completo</label
                >
                <input
                  v-model.trim="form.fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  autocomplete="name"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  v-model.trim="form.email"
                  type="email"
                  placeholder="seu@email.com"
                  autocomplete="email"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p v-if="form.email && !emailValid" class="text-xs text-red-600 mt-1">
                  Informe um email válido.
                </p>
              </div>

              <!-- Espaço vazio pra alinhar -->
              <div></div>
            </div>

            <!-- Divider suave -->
            <div class="my-6 h-px bg-slate-100"></div>

            <!-- Senhas -->
            <h4 class="text-sm font-semibold text-slate-900">Alterar senha</h4>
            <p class="text-slate-500 text-xs mt-1">
              Preencha todos os campos para trocar sua senha
            </p>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Senha Atual -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Senha atual</label
                >
                <div class="relative">
                  <input
                    :type="showPwd.current ? 'text' : 'password'"
                    v-model="form.currentPassword"
                    placeholder="Senha atual"
                    autocomplete="current-password"
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                    @click="showPwd.current = !showPwd.current"
                    aria-label="Alternar visibilidade"
                  >
                    <EyeIcon :on="showPwd.current" />
                  </button>
                </div>
              </div>

              <!-- Nova senha -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nova senha</label
                >
                <div class="relative">
                  <input
                    :type="showPwd.next ? 'text' : 'password'"
                    v-model="form.newPassword"
                    placeholder="Nova senha"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                    @click="showPwd.next = !showPwd.next"
                    aria-label="Alternar visibilidade"
                  >
                    <EyeIcon :on="showPwd.next" />
                  </button>
                </div>
              </div>

              <!-- Confirmar -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Confirmar senha</label
                >
                <div class="relative">
                  <input
                    :type="showPwd.confirm ? 'text' : 'password'"
                    v-model="form.confirmPassword"
                    placeholder="Confirmar senha"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                    @click="showPwd.confirm = !showPwd.confirm"
                    aria-label="Alternar visibilidade"
                  >
                    <EyeIcon :on="showPwd.confirm" />
                  </button>
                </div>
                <p v-if="!passwordMatch" class="text-xs text-red-600 mt-1">
                  As senhas não coincidem.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer do card (fixo no card, não na tela) -->
          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50/60 rounded-b-2xl"
          >
            <p
              v-if="message.text"
              :class="message.type === 'success' ? 'text-emerald-600' : 'text-red-600'"
              class="text-sm mr-auto"
            >
              {{ message.text }}
            </p>

            <button
              class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-medium px-5 py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || !isDirty || !formValid"
              @click="saveChanges"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <span v-else>Salvar alterações</span>
            </button>
          </div>
        </div>

        <!-- Contato & Endereço -->
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div class="p-6">
            <h3 class="text-base font-semibold text-slate-900">Contato & Endereço</h3>
            <p class="text-slate-500 text-sm mt-1">Telefone, CEP e localização</p>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Telefone -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Telefone</label
                >
                <input
                  v-model.trim="form.telefone"
                  type="text"
                  placeholder="Ex: (67) 99999-9999"
                  @blur="onBlurPhone"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p v-if="form.telefone && !telefoneOk" class="text-xs text-red-600 mt-1">
                  Telefone inválido.
                </p>
              </div>

              <!-- CEP -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                <input
                  v-model="form.cep"
                  type="text"
                  placeholder="Ex: 79800-000"
                  @blur="onBlurCEP"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p v-if="form.cep && !cepOk" class="text-xs text-red-600 mt-1">
                  CEP inválido.
                </p>
              </div>

              <!-- Endereço -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Endereço</label
                >
                <input
                  v-model.trim="form.endereco"
                  type="text"
                  placeholder="Ex: Rua Monte Alegre, 1519"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <!-- Cidade -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Cidade</label
                >
                <input
                  v-model.trim="form.cidade"
                  type="text"
                  placeholder="Ex: Dourados"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <!-- Estado (UF) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Estado (UF)</label
                >
                <input
                  v-model="form.estado"
                  maxlength="2"
                  type="text"
                  placeholder="EX: MS"
                  @input="onInputUF"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 uppercase"
                />
                <p v-if="form.estado && !ufOk" class="text-xs text-red-600 mt-1">
                  Informe apenas 2 letras (UF).
                </p>
              </div>
            </div>
          </div>

          <!-- footer do card -->
          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50/60 rounded-b-2xl"
          >
            <button
              class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-medium px-5 py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || !isDirty || !formValid"
              @click="saveChanges"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <span v-else>Salvar alterações</span>
            </button>
          </div>
        </div>

        <!-- Dica/Info lateral (opcional) -->
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
          <h3 class="text-base font-semibold text-slate-900">Dicas rápidas</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li>• Use seu telefone para receber avisos importantes.</li>
            <li>• Manter CEP/UF certos ajuda no preenchimento automático.</li>
            <li>• Troque a senha periodicamente para mais segurança.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Conteúdo: Usuários -->
    <section v-else class="bg-transparent p-0">
      <UsersList />
    </section>
    <!-- Modal de feedback -->
    <div v-if="feedback.open" class="fixed inset-0 z-50 grid place-items-center">
      <div class="absolute inset-0 bg-black/40" @click="closeFeedback"></div>

      <div
        class="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-6"
      >
        <div class="flex items-start gap-3">
          <div
            :class="
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : feedback.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-sky-100 text-sky-700'
            "
            class="h-10 w-10 rounded-xl grid place-items-center"
          >
            <!-- ícones -->
            <svg
              v-if="feedback.type === 'success'"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <svg
              v-else-if="feedback.type === 'error'"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          </div>

          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-900">{{ feedback.title }}</h3>
            <p class="text-slate-600 mt-1">{{ feedback.text }}</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            @click="closeFeedback"
            class="inline-flex items-center rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.i-lucide-user::before,
.i-lucide-users::before {
  display: none;
}
</style>
