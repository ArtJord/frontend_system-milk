<template>
  <div class="w-full">
    <!-- Toast message -->
    <div
      v-if="showToast"
      class="fixed top-5 right-5 z-60 rounded-lg px-4 py-2 text-white shadow-lg transition-all"
      :class="{
        'bg-green-600': toastType === 'success',
        'bg-red-600': toastType === 'error',
        'bg-yellow-500': toastType === 'warning',
      }"
      role="status"
      aria-live="polite"
    >
      {{ toastMessage }}
    </div>

    <!-- Toolbar: busca + criar -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex-1">
        <input
          v-model="q"
          type="text"
          placeholder="Buscar por responsável, turno ou tipo"
          class="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        @click="openCreate"
      >
        Novo registro de leite
      </button>
    </div>

    <!-- Filtros rápidos -->
    <div class="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <label class="text-sm text-gray-700">De</label>
        <input
          type="date"
          v-model="filtros.inicio"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>
      <div>
        <label class="text-sm text-gray-700">Até</label>
        <input
          type="date"
          v-model="filtros.fim"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>
      <div>
        <label class="text-sm text-gray-700">Turno</label>
        <select
          v-model="filtros.turno"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        >
          <option value="">Todos</option>
          <option v-for="t in TURNOS" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="flex items-end gap-2">
        <button
          @click="loadList"
          class="rounded-lg bg-gray-900 text-white px-4 py-2 hover:bg-black"
        >
          Aplicar
        </button>
        <button
          @click="resetFiltros"
          class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Limpar
        </button>
      </div>
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-500">
              {{ fmtData(item.data_producao) }} • {{ item.turno || "—" }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-gray-900">
              {{ fmtNumero(item.quantidade_litros) }} L
            </div>
            <div class="mt-1 text-sm text-gray-700">
              Responsável: <span class="font-medium">{{ item.responsavel }}</span>
            </div>
            <div class="mt-1 text-xs text-gray-600">
              Tipo: {{ item.tipo_leite || "—" }} • Qualidade: {{ item.qualidade || "—" }}
            </div>
            <div class="mt-1 text-xs text-gray-600">
              Equipamento: {{ item.equipamento_utilizado || "—" }} • Armazenamento:
              {{ item.local_armazenamento || "—" }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="openEdit(item)"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Editar
            </button>
            <button
              v-if="canDelete"
              @click="openConfirmDelete(item)"
              class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </div>
        <div
          v-if="item.observacao"
          class="mt-3 rounded-md bg-gray-50 p-2 text-sm text-gray-700"
        >
          {{ item.observacao }}
        </div>
        <div
          v-if="item.animais_contribuintes && item.animais_contribuintes.length"
          class="mt-2"
        >
          <div class="text-xs text-gray-500">Animais contribuintes (IDs):</div>
          <div class="text-xs text-gray-700">
            {{
              Array.isArray(item.animais_contribuintes)
                ? item.animais_contribuintes.join(", ")
                : item.animais_contribuintes
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal central de confirmação -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div class="px-6 py-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 id="confirm-title" class="text-lg font-semibold text-gray-900">
                Confirmar exclusão
              </h2>
              <p class="mt-2 text-sm text-gray-600">
                Tem certeza que deseja excluir este registro de leite?
              </p>

              <div
                v-if="confirmItem"
                class="mt-4 rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700"
              >
                <div><strong>Data:</strong> {{ fmtData(confirmItem.data_producao) }}</div>
                <div class="mt-1">
                  <strong>Quantidade:</strong>
                  {{ fmtNumero(confirmItem.quantidade_litros) }} L
                </div>
                <div class="mt-1">
                  <strong>Responsável:</strong> {{ confirmItem.responsavel || "—" }}
                </div>
              </div>
            </div>

            <button
              @click="cancelConfirm"
              class="ml-3 rounded-md p-2 text-gray-400 hover:bg-gray-50"
              aria-label="Fechar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              @click="cancelConfirm"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              @click="confirmDeleteConfirmed"
              :disabled="deletingId === (confirmItem && confirmItem.id)"
              class="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div class="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? "Editar registro de leite" : "Novo registro de leite" }}
          </h3>
          <button @click="close" class="rounded-md p-1.5 hover:bg-gray-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="max-h-[75vh] overflow-y-auto px-5 py-4">
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Dados da produção</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700"
                  >Data da produção <span class="text-red-600">*</span></label
                >
                <input
                  type="date"
                  v-model="form.data_producao"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.data_producao" class="text-xs text-red-600 mt-1">
                  {{ errors.data_producao }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-700">Turno</label>
                <select
                  v-model="form.turno"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="t in TURNOS" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700"
                  >Quantidade (litros) <span class="text-red-600">*</span></label
                >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  v-model.number="form.quantidade_litros"
                  placeholder="Ex.: 120"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.quantidade_litros" class="text-xs text-red-600 mt-1">
                  {{ errors.quantidade_litros }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-700"
                  >Responsável <span class="text-red-600">*</span></label
                >
                <input
                  v-model="form.responsavel"
                  placeholder="Ex.: João"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.responsavel" class="text-xs text-red-600 mt-1">
                  {{ errors.responsavel }}
                </p>
              </div>
            </div>
          </section>

          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Qualidade e tipo</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-sm text-gray-700">Tipo de leite</label>
                <select
                  v-model="form.tipo_leite"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Qualidade</label>
                <select
                  v-model="form.qualidade"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="q in QUALIDADES" :key="q" :value="q">{{ q }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  v-model.number="form.temperatura"
                  placeholder="Ex.: 3.5"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>
          </section>

          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Processo</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700">Equipamento utilizado</label>
                <select
                  v-model="form.equipamento_utilizado"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="e in EQUIPAMENTOS" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Local de armazenamento</label>
                <select
                  v-model="form.local_armazenamento"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="l in LOCAIS" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="text-sm text-gray-700">Animais contribuintes</label>
                <div class="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    class="rounded-md border border-gray-300 p-2 max-h-48 overflow-y-auto"
                  >
                    <div class="text-xs text-gray-500 mb-1">Selecione vacas</div>
                    <div v-if="loadingVacas" class="text-sm text-gray-500">
                      Carregando...
                    </div>
                    <div v-else class="space-y-1">
                      <label
                        v-for="v in vacas"
                        :key="v.id"
                        class="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          :value="v.id"
                          v-model="form.animais_contribuintes"
                          class="rounded border-gray-300"
                        />
                        <span class="text-gray-700"
                          >#{{ v.numero_animal }} —
                          {{ v.nome_animal || "sem nome" }}</span
                        >
                      </label>
                    </div>
                  </div>
                  <div class="rounded-md border border-gray-300 p-2">
                    <div class="text-xs text-gray-500 mb-1">IDs selecionados</div>
                    <div class="text-sm text-gray-800 min-h-[2rem]">
                      {{ form.animais_contribuintes.join(", ") || "—" }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Observação</h4>
            <textarea
              v-model="form.observacao"
              rows="3"
              placeholder="Anotações relevantes"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            ></textarea>
          </section>
        </div>

        <div
          class="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4"
        >
          <button
            @click="close"
            class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            :disabled="saving"
            @click="submit"
            class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {{ saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import http from "@/lib/http";

// Recupera cargo do usuário
function getUserRole() {
  const byStorage =
    localStorage.getItem("user_cargo") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("cargo");
  if (byStorage) return byStorage.toLowerCase();

  const t = localStorage.getItem("auth_token");
  if (t && t.split(".").length === 3) {
    try {
      const payload = JSON.parse(
        atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const r = payload.role || payload.cargo;
      if (r) return String(r).toLowerCase();
    } catch {}
  }
  return "usuario";
}

// Refs e estados
const route = useRoute();
const userRole = ref(getUserRole());
const canDelete = computed(() => userRole.value === "gerente");

const TURNOS = ["Manhã", "Tarde", "Noite"];
const TIPOS = ["Desnatado", "Integral", "Semi-desnatado", "Orgânico"];
const QUALIDADES = ["A+", "A", "B", "C"];
const EQUIPAMENTOS = [
  "Ordenha manual",
  "Ordenha mecânica 1",
  "Ordenha mecânica 2",
  "Sala de ordenha",
];
const LOCAIS = [
  "Tanque de resfriamento 1",
  "Tanque de resfriamento 2",
  "Direto no caminhão",
  "Área de processamento",
];

const q = ref("");
const filtros = ref({ inicio: "", fim: "", turno: "" });
const lista = ref([]);
const loading = ref(false);

const vacas = ref([]);
const loadingVacas = ref(false);
const deletingId = ref(null);

const showModal = ref(false);
const isEditing = ref(false);
const saving = ref(false);

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

const currentId = ref(null);
const form = ref({
  data_producao: "",
  quantidade_litros: null,
  responsavel: "",
  turno: "",
  tipo_leite: "",
  qualidade: "",
  temperatura: null,
  equipamento_utilizado: "",
  animais_contribuintes: [],
  local_armazenamento: "",
  observacao: "",
});
const errors = ref({});

// Modal de confirmação
const showConfirm = ref(false);
const confirmItem = ref(null);

// Helpers
const fmtNumero = (n) => {
  const v = Number(n || 0);
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
const fmtData = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
};

// Normaliza contribuintes
function normalizeContribuintes(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  if (s.startsWith("{") && s.endsWith("}")) {
    return s
      .slice(1, -1)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Filtro computado
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  return lista.value.filter((it) => {
    const txt = `${it.responsavel || ""} ${it.turno || ""} ${
      it.tipo_leite || ""
    }`.toLowerCase();
    const passText = !term || txt.includes(term);
    const passTurno =
      !filtros.value.turno ||
      (it.turno && it.turno.toLowerCase() === filtros.value.turno.toLowerCase());
    const di = filtros.value.inicio ? new Date(filtros.value.inicio) : null;
    const df = filtros.value.fim ? new Date(filtros.value.fim) : null;
    const dt = it.data_producao ? new Date(it.data_producao) : null;
    const passData = (!di || (dt && dt >= di)) && (!df || (dt && dt <= df));
    return passText && passTurno && passData;
  });
});

function resetFiltros() {
  filtros.value = { inicio: "", fim: "", turno: "" };
}

// Carrega lista de leite
async function loadList() {
  loading.value = true;
  try {
    const { data } = await http.get("/allleite");
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.leites)
      ? data.leites
      : [];
    lista.value = (arr || []).map((row) => ({
      ...row,
      animais_contribuintes: normalizeContribuintes(row.animais_contribuintes),
    }));
  } catch (e) {
    alert(e?.response?.data?.message || "Erro ao carregar registros de leite.");
  } finally {
    loading.value = false;
  }
}

// Carrega vacas
async function loadVacas() {
  loadingVacas.value = true;
  try {
    const { data } = await http.get("/vacas");
    vacas.value = Array.isArray(data) ? data : [];
  } catch (e) {
    vacas.value = [];
  } finally {
    loadingVacas.value = false;
  }
}

// Abrir modal criar
function openCreate() {
  isEditing.value = false;
  currentId.value = null;
  form.value = {
    data_producao: "",
    quantidade_litros: null,
    responsavel: "",
    turno: "",
    tipo_leite: "",
    qualidade: "",
    temperatura: null,
    equipamento_utilizado: "",
    animais_contribuintes: [],
    local_armazenamento: "",
    observacao: "",
  };
  errors.value = {};
  showModal.value = true;
  if (!vacas.value.length) loadVacas();
}

// Abrir modal editar
function openEdit(item) {
  isEditing.value = true;
  currentId.value = item.id;
  form.value = {
    data_producao: item.data_producao || "",
    quantidade_litros: item.quantidade_litros ?? null,
    responsavel: item.responsavel || "",
    turno: item.turno || "",
    tipo_leite: item.tipo_leite || "",
    qualidade: item.qualidade || "",
    temperatura: item.temperatura ?? null,
    equipamento_utilizado: item.equipamento_utilizado || "",
    animais_contribuintes: normalizeContribuintes(item.animais_contribuintes),
    local_armazenamento: item.local_armazenamento || "",
    observacao: item.observacao || "",
  };
  errors.value = {};
  showModal.value = true;
  if (!vacas.value.length) loadVacas();
}

function close() {
  showModal.value = false;
}

// Validação formulário
function validate() {
  errors.value = {};
  let ok = true;
  if (!form.value.data_producao) {
    errors.value.data_producao = "Informe a data.";
    ok = false;
  }
  if (form.value.quantidade_litros == null || Number(form.value.quantidade_litros) <= 0) {
    errors.value.quantidade_litros = "Litros deve ser maior que 0.";
    ok = false;
  }
  if (!form.value.responsavel?.trim()) {
    errors.value.responsavel = "Informe o responsável.";
    ok = false;
  }
  return ok;
}

// Submit form
async function submit() {
  if (!validate()) return;
  saving.value = true;
  try {
    const payload = { ...form.value };
    [
      "turno",
      "tipo_leite",
      "qualidade",
      "equipamento_utilizado",
      "local_armazenamento",
      "observacao",
    ].forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });
    if (payload.temperatura === "") payload.temperatura = null;
    if (Array.isArray(payload.animais_contribuintes)) {
      const arr = payload.animais_contribuintes
        .map((n) => Number(n))
        .filter((n) => !Number.isNaN(n));
      payload.animais_contribuintes = arr.length ? `{${arr.join(",")}}` : null;
    }
    if (isEditing.value) {
      await http.put(`/leite/${currentId.value}`, { id: currentId.value, ...payload });
    } else {
      await http.post("/leite", payload);
    }
    await loadList();
    showModal.value = false;
  } catch (e) {
    console.error(
      "Falha ao salvar:",
      e?.response?.status,
      e?.response?.data || e?.message
    );
    alert(
      e?.response?.data?.message ||
        (isEditing.value ? "Erro ao salvar edição." : "Erro ao cadastrar.")
    );
  } finally {
    saving.value = false;
  }
}

// Abrir modal de confirmação
function openConfirmDelete(item) {
  if (userRole.value !== "gerente") {
    alert("Apenas usuários com cargo GERENTE podem excluir registros de leite.");
    return;
  }
  confirmItem.value = item;
  showConfirm.value = true;
}

// Cancelar confirmação
function cancelConfirm() {
  confirmItem.value = null;
  showConfirm.value = false;
}

// Confirmar exclusão
async function confirmDeleteConfirmed() {
  if (!confirmItem.value) return;
  const item = confirmItem.value;
  const idRaw = item?.id ?? item?.ID ?? item?._id;
  const id = idRaw ? Number(idRaw) : NaN;
  if (!id || Number.isNaN(id)) {
    toastMessage.value = "Não foi possível identificar o ID do registro.";
    toastType.value = "error";
    showToast.value = true;
    setTimeout(() => (showToast.value = false), 4000);
    return;
  }
  if (deletingId.value === id) return;
  deletingId.value = id;
  try {
    await http.delete(`/leite/${id}`, { data: { id } });
    await loadList();
    toastMessage.value = "Registro excluído com sucesso.";
    toastType.value = "success";
    showToast.value = true;
    setTimeout(() => (showToast.value = false), 4000);
  } catch (e) {
    toastMessage.value = "Erro ao excluir registro.";
    toastType.value = "error";
    showToast.value = true;
    setTimeout(() => (showToast.value = false), 4000);
  } finally {
    deletingId.value = null;
    confirmItem.value = null;
    showConfirm.value = false;
  }
}

// Mounted
onMounted(() => {
  loadList();
  loadVacas();
});
</script>
