<template>
  <div class="w-full">
    <!-- Toolbar: busca + criar -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex-1">
        <input
          v-model="q"
          type="text"
          placeholder="Buscar por número ou nome"
          class="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Cadastrar animal
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
        <label class="text-sm text-gray-700">Categoria</label>
        <select
          v-model="filtros.categoria"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        >
          <option value="">Todas</option>
          <option v-for="s in STATUSS" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="flex items-end gap-2">
        <button
          @click="load"
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

    <!-- Estados -->
    <div v-if="loading" class="py-10 text-center text-gray-500">Carregando...</div>
    <div v-else-if="error" class="py-3 text-red-600">{{ error }}</div>

    <!-- Grid de cards -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
    >
      <div
        v-for="a in filtered"
        :key="a.id || a.id_vaca || a.numero_animal"
        class="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
      >
       <!-- Ações -->
  <div class="absolute top-3 right-3 flex items-center gap-2">
    <!-- Editar -->
    <button
      @click="openEdit(a)"
      class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-green-600 hover:text-white transition"
      :title="`Editar ${a.nome_animal || ''}`"
    >
      <Pencil class="h-4 w-4" />
    </button>

    <!-- Excluir -->
    <button
      v-if="canDelete"
      @click="openConfirm(a)"
      :disabled="deletingId === (a.id ?? a.id_vaca ?? a.ID ?? null)"
      class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition disabled:opacity-60"
      title="Excluir"
    >
      <!-- Ícone lixeira -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V4h6v3m2 0v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
      </svg>
    </button>
  </div>
        <div class="flex items-start justify-between mb-2">
          <div class="text-xs text-gray-500">Nº {{ a.numero_animal || "—" }}</div>
          <Milk class="h-4 w-4 text-green-600" />
        </div>

        <h3 class="text-lg font-semibold text-gray-900 leading-tight">
          {{ a.nome_animal || "Sem nome" }}
        </h3>
        <p class="text-sm text-gray-500">{{ a.raca || "—" }}</p>

        <dl class="mt-3 grid grid-cols-2 gap-y-1 text-sm text-gray-700">
          <dt class="text-gray-500">Sexo</dt>
          <dd>{{ a.sexo || "—" }}</dd>

          <dt class="text-gray-500">Nascimento</dt>
          <dd>{{ formatDateBR(a.data_nascimento) }}</dd>

          <dt class="text-gray-500">Peso (kg)</dt>
          <dd>{{ a.peso_kg ?? "—" }}</dd>

          <dt class="text-gray-500">Cor</dt>
          <dd>{{ a.cor || "—" }}</dd>

          <dt class="text-gray-500">Status</dt>
          <dd>{{ a.statuss || "—" }}</dd>
        </dl>

        <p v-if="a.observacoes" class="mt-3 text-sm text-gray-600">
          {{ a.observacoes }}
        </p>

        
        
      </div>
    </div>

    <!-- Modal criar/editar -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div class="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div class="sticky top-0 flex items-center justify-between border-b px-5 py-3">
          <h3 class="font-semibold">{{ modalTitle }}</h3>
          <button @click="closeCreate" class="rounded-md p-1 hover:bg-gray-100">
            <X class="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto px-5 py-4">
          <!-- Identificação -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Identificação</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700"
                  >Número do animal <span class="text-red-600">*</span></label
                >
                <input
                  v-model="form.numero_animal"
                  placeholder="Ex.: A001"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.numero_animal" class="text-xs text-red-600 mt-1">
                  {{ errors.numero_animal }}
                </p>
              </div>

              <div>
                <label class="text-sm text-gray-700"
                  >Nome <span class="text-red-600">*</span></label
                >
                <input
                  v-model="form.nome_animal"
                  placeholder="Ex.: Estrela"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.nome_animal" class="text-xs text-red-600 mt-1">
                  {{ errors.nome_animal }}
                </p>
              </div>
            </div>
          </section>

          <!-- Características -->
          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Características</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700"
                  >Raça <span class="text-red-600">*</span></label
                >
                <select
                  v-model="form.raca"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>Selecione...</option>
                  <option v-for="r in RACAS" :key="r" :value="r">{{ r }}</option>
                </select>
                <p v-if="errors.raca" class="text-xs text-red-600 mt-1">
                  {{ errors.raca }}
                </p>
              </div>

              <div>
                <label class="text-sm text-gray-700 block"
                  >Sexo <span class="text-red-600">*</span></label
                >
                <div class="mt-2 flex gap-4">
                  <label class="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      value="F"
                      v-model="form.sexo"
                      class="accent-green-600"
                    />
                    <span>Fêmea</span>
                  </label>
                  <label class="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      value="M"
                      v-model="form.sexo"
                      class="accent-green-600"
                    />
                    <span>Macho</span>
                  </label>
                </div>
                <p v-if="errors.sexo" class="text-xs text-red-600 mt-1">
                  {{ errors.sexo }}
                </p>
              </div>

              <div>
                <label class="text-sm text-gray-700">Data de nascimento</label>
                <input
                  type="date"
                  v-model="form.data_nascimento"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  v-model.number="form.peso_kg"
                  placeholder="Ex.: 520.00"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700">Cor</label>
                <input
                  v-model="form.cor"
                  placeholder="Ex.: Preta e branca"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700"
                  >Status <span class="text-red-600">*</span></label
                >
                <select
                  v-model="form.statuss"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>Selecione...</option>
                  <option v-for="s in STATUSS" :key="s" :value="s">{{ s }}</option>
                </select>
                <p v-if="errors.statuss" class="text-xs text-red-600 mt-1">
                  {{ errors.statuss }}
                </p>
              </div>
            </div>
          </section>

          <!-- Saúde & Reprodução -->
          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Saúde & Reprodução</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700">Estado de saúde</label>
                <select
                  v-model="form.estado_saude"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>Selecione...</option>
                  <option v-for="s in ESTADOS_SAUDE" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div>
                <label class="text-sm text-gray-700">Status reprodutivo</label>
                <select
                  v-model="form.status_reprodutivo"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>Selecione...</option>
                  <option v-for="s in STATUS_REPRO" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div>
                <label class="text-sm text-gray-700">Última vacinação</label>
                <input
                  type="date"
                  v-model="form.ultima_vacinacao"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700">Próxima vacinação</label>
                <input
                  type="date"
                  v-model="form.proxima_vacinacao"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700">Produção diária (L)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  v-model.number="form.producao_diaria_litros"
                  placeholder="Ex.: 18.50"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>
          </section>

          <!-- Observações -->
          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Observações</h4>
            <textarea
              v-model="form.observacoes"
              rows="3"
              placeholder="Informações adicionais..."
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            ></textarea>
          </section>
        </div>

        <div
          class="sticky bottom-0 flex items-center justify-end gap-2 border-t px-5 py-3"
        >
          <button @click="closeCreate" class="rounded-lg px-4 py-2 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            :disabled="saving"
            @click="submit"
            class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {{ saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar" }}
          </button>
        </div>
      </div>
    </div>
    <!-- Modal central de confirmação (aparece no centro da tela) -->
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
                Tem certeza que deseja excluir este animal? Esta ação é irreversível.
              </p>

              <div
                v-if="confirmItem"
                class="mt-4 rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700"
              >
                <div><strong>Nº:</strong> {{ confirmItem.numero_animal || "—" }}</div>
                <div class="mt-1">
                  <strong>Nome:</strong> {{ confirmItem.nome_animal || "—" }}
                </div>
                <div class="mt-1">
                  <strong>Raça:</strong> {{ confirmItem.raca || "—" }}
                </div>
              </div>
            </div>

            <button
              @click="cancelConfirm"
              class="ml-3 rounded-md p-2 text-gray-400 hover:bg-gray-50"
              aria-label="Fechar"
            ></button>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              @click="cancelConfirm"
              class="rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              @click="confirmDeleteConfirmed"
              :disabled="
                deletingId ===
                (confirmItem &&
                  (confirmItem.id ?? confirmItem.id_vaca ?? confirmItem.ID ?? null))
              "
              class="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Plus, X, Milk, Pencil } from "lucide-vue-next";
import http from "@/lib/http";
import { formatDateBR } from "@/utils/date";

//teste
const REQUIRED_ON_UPDATE = ["numero_animal"];

// Endpoints
const LIST_ENDPOINT = "/vacas"; // GET (listar)
const CREATE_ENDPOINT = "/vaca"; // POST (criar)

// Estado base
const loading = ref(false);
const error = ref("");
const items = ref([]);
const q = ref("");

// Filtros
const filtros = ref({
  inicio: "",
  fim: "",
  categoria: "",
});

// Enums (CHECK do PostgreSQL)
const RACAS = [
  "Holandesa",
  "Jersey",
  "Girolando",
  "Gir",
  "Nelore",
  "Angus",
  "Simental",
  "Outros",
];
const ESTADOS_SAUDE = ["Excelente", "Boa", "Regular", "Ruim", "Crítica"];
const STATUSS = ["Ativa", "Prenha Seca", "Doente", "Vendida"];
const STATUS_REPRO = ["Vazia", "Prenha", "Seca", "Lactante", "No Cio"];

// Modal / edição
const showModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const modalTitle = computed(() =>
  isEditing.value ? "Editar animal" : "Cadastrar animal"
);

// Form & snapshot (para diff/validação condicional)
const blankForm = () => ({
  numero_animal: "",
  nome_animal: "",
  raca: "",
  sexo: "", // 'M' | 'F'
  data_nascimento: "",
  peso_kg: null,
  cor: "",
  statuss: "",
  estado_saude: "",
  ultima_vacinacao: "",
  proxima_vacinacao: "",
  status_reprodutivo: "",
  producao_diaria_litros: null,
  observacoes: "",
});
const form = ref(blankForm());
const originalForm = ref(null); // snapshot ao abrir edição

const errors = ref({
  numero_animal: "",
  nome_animal: "",
  raca: "",
  sexo: "",
  statuss: "",
});

// Filtro
const filtered = computed(() => {
  if (!q.value) return items.value;
  const s = q.value.toLowerCase();
  return items.value.filter(
    (a) =>
      String(a.numero_animal || "")
        .toLowerCase()
        .includes(s) ||
      String(a.nome_animal || "")
        .toLowerCase()
        .includes(s)
  );
});


const changed = (key) => {
  if (!isEditing.value || !originalForm.value) return true; // em criação, considere "mudou" p/ validar tudo
  return form.value[key] !== originalForm.value[key];
};

// Carregar lista
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const r = await http.get(LIST_ENDPOINT, {
      params: {
        inicio: filtros.value.inicio || undefined,
        fim: filtros.value.fim || undefined,
        categoria: filtros.value.categoria || undefined,
      },
    });

    const payload = Array.isArray(r.data) ? r.data : r.data?.data || [];
    // fallback local
    items.value = applyLocalFilters(payload, filtros.value);
  } catch (e) {
    error.value = e?.response?.data?.message || "Não foi possível carregar os animais.";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

// Abrir/criar
function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  originalForm.value = null;
  form.value = blankForm();
  errors.value = { numero_animal: "", nome_animal: "", raca: "", sexo: "", statuss: "" };
  showModal.value = true;
}

// Fechar modal
function closeCreate() {
  showModal.value = false;
  isEditing.value = false;
  editingId.value = null;
  originalForm.value = null;
  form.value = blankForm();
  errors.value = { numero_animal: "", nome_animal: "", raca: "", sexo: "", statuss: "" };
}

// Abrir/editar
function openEdit(animal) {
  const id = animal?.id ?? animal?.id_vaca ?? animal?.idAnimal ?? null;
  editingId.value = id;
  isEditing.value = true;

  const filled = {
    numero_animal: animal.numero_animal ?? "",
    nome_animal: animal.nome_animal ?? "",
    raca: animal.raca ?? "",
    sexo: animal.sexo ?? "",
    data_nascimento: animal.data_nascimento ?? "",
    peso_kg: animal.peso_kg ?? null,
    cor: animal.cor ?? "",
    statuss: animal.statuss ?? "",
    estado_saude: animal.estado_saude ?? "",
    ultima_vacinacao: animal.ultima_vacinacao ?? "",
    proxima_vacinacao: animal.proxima_vacinacao ?? "",
    status_reprodutivo: animal.status_reprodutivo ?? "",
    producao_diaria_litros: animal.producao_diaria_litros ?? null,
    observacoes: animal.observacoes ?? "",
  };

  form.value = { ...filled };
  originalForm.value = { ...filled }; // snapshot para diff/validação
  errors.value = { numero_animal: "", nome_animal: "", raca: "", sexo: "", statuss: "" };
  showModal.value = true;
}

// Validação (condicional na edição)
function validate() {
  errors.value = { numero_animal: "", nome_animal: "", raca: "", sexo: "", statuss: "" };
  let ok = true;

  // número
  if (!isEditing.value || changed("numero_animal")) {
    if (!form.value.numero_animal?.trim()) {
      errors.value.numero_animal = "Número do animal é obrigatório.";
      ok = false;
    }
  }
  // nome
  if (!isEditing.value || changed("nome_animal")) {
    if (!form.value.nome_animal?.trim()) {
      errors.value.nome_animal = "Nome é obrigatório.";
      ok = false;
    }
  }
  // raca
  if (!isEditing.value || changed("raca")) {
    if (!form.value.raca || !RACAS.includes(form.value.raca)) {
      errors.value.raca = "Selecione uma raça válida.";
      ok = false;
    }
  }
  // sexo
  if (!isEditing.value || changed("sexo")) {
    if (!["M", "F"].includes(form.value.sexo)) {
      errors.value.sexo = "Selecione o sexo (M ou F).";
      ok = false;
    }
  }
  // statuss
  if (!isEditing.value || changed("statuss")) {
    if (!form.value.statuss || !STATUSS.includes(form.value.statuss)) {
      errors.value.statuss = "Selecione um status válido.";
      ok = false;
    }
  }

  return ok;
}

async function submit() {
  if (!validate()) return;
  saving.value = true;
  try {
    if (isEditing.value) {
      if (!editingId.value) throw new Error("ID do animal não encontrado para editar.");

      
      const diff = {};
      Object.keys(form.value).forEach((k) => {
        const vNow = form.value[k];
        const vOld = originalForm.value?.[k];
        if (vNow !== vOld) {
          if (
            vNow === "" ||
            vNow === null ||
            (typeof vNow === "string" && vNow.trim() === "") ||
            (typeof vNow === "number" && Number.isNaN(vNow))
          )
            return;
          diff[k] = vNow;
        }
      });

      
      REQUIRED_ON_UPDATE.forEach((k) => {
        const v = form.value[k];
        if (
          v !== undefined &&
          v !== null &&
          !(typeof v === "string" && v.trim() === "")
        ) {
          diff[k] = v;
        }
      });

      // se nada mudou e nenhum obrigatório foi incluído, apenas fecha
      if (Object.keys(diff).length === 0) {
        closeCreate();
        return;
      }

      const resp = await http.put(`/vaca/${editingId.value}`, diff);
      if (resp.status === 200) {
        closeCreate();
        await load();
      } else {
        alert("Não foi possível salvar as alterações.");
      }
    } else {
      // criação
      const payload = { ...form.value };
      Object.keys(payload).forEach((k) => {
        const v = payload[k];
        if (
          v === "" ||
          v === null ||
          (typeof v === "string" && v.trim() === "") ||
          (typeof v === "number" && Number.isNaN(v))
        ) {
          delete payload[k];
        }
      });
      const resp = await http.post(CREATE_ENDPOINT, payload);
      if (resp.status === 200 || resp.status === 201) {
        closeCreate();
        await load();
      } else {
        alert("Não foi possível cadastrar.");
      }
    }
  } catch (e) {
    alert(
      e?.response?.data?.message ??
        (isEditing.value ? "Erro ao editar animal." : "Erro ao cadastrar animal.")
    );
  } finally {
    saving.value = false;
  }
}
function getUserRole() {
  const raw =
    localStorage.getItem("user_cargo") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("cargo");

  let role = raw;
  if (!role) {
    const t = localStorage.getItem("auth_token");
    if (t && t.split?.(".").length === 3) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        role = payload.role || payload.cargo;
      } catch {}
    }
  }

  const s = String(role || "").toLowerCase();
  if (["admin", "adm"].includes(s)) return "administrador";
  if (["manager"].includes(s)) return "gerente";
  if (["user", "usuario", "colaborador"].includes(s)) return "funcionario";
  return s || "usuario";
}

const userRole = ref(getUserRole());
const canDelete = computed(() => ["gerente", "administrador"].includes(userRole.value));

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

function showToastMsg(msg, type = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 4000);
}

const showConfirm = ref(false);
const confirmItem = ref(null);
const deletingId = ref(null); // evita chamadas paralelas

function openConfirm(item) {
  confirmItem.value = item;
  showConfirm.value = true;
}

function cancelConfirm() {
  confirmItem.value = null;
  showConfirm.value = false;
}

const DELETE_ENDPOINT_BASE = "/vaca";

async function performDelete(item) {
  const idRaw = item?.id ?? item?.id_vaca ?? item?.ID;
  const id = idRaw ? Number(idRaw) : NaN;

  console.debug("performDelete", { idRaw, id });

  if (!id || Number.isNaN(id)) {
    showToastMsg("ID inválido — não foi possível excluir o registro.", "error");
    console.error("ID inválido para exclusão:", idRaw, item);
    return false;
  }

  if (!["gerente", "administrador"].includes(userRole.value)) {
    showToastMsg("Apenas gerente/administrador podem excluir.", "warning");
    return false;
  }

  if (deletingId.value === id) return false;
  deletingId.value = id;

  try {
    await http.delete(`${DELETE_ENDPOINT_BASE}/${id}`, { data: { id } });

    showToastMsg && showToastMsg("Registro excluído com sucesso.", "success");
    return true;
  } catch (e) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message;
    if (status === 401 || status === 403) {
      showToastMsg && showToastMsg("Permissão negada pelo servidor.", "error");
    } else if (status === 400 && /id.*obrigat/i.test(msg || "")) {
      showToastMsg &&
        showToastMsg("Backend reclamou do ID (verifique o formato).", "error");
      console.error("Backend message:", msg);
    } else {
      showToastMsg && showToastMsg(msg || "Erro ao excluir (veja console).", "error");
      console.error("Erro ao excluir:", status, msg || e?.message);
    }
    return false;
  } finally {
    deletingId.value = null;
  }
}

async function confirmDeleteConfirmed() {
  if (!confirmItem.value) return;
  const ok = await performDelete(confirmItem.value);
  if (ok) {
    // recarrega lista após exclusão
    try {
      await load();
    } catch (e) {
      console.error("Erro reload após delete", e);
    }
    cancelConfirm();
  }
}

function applyLocalFilters(list, f) {
  const ini = (f.inicio || "").slice(0, 10);
  const fim = (f.fim || "").slice(0, 10);
  const cat = (f.categoria || "").toLowerCase();

  return list.filter((a) => {
    const d = (a.data_nascimento || "").slice(0, 10);
    if (ini && d && d < ini) return false;
    if (fim && d && d > fim) return false;

    const s = (a.statuss || "").toLowerCase();
    if (cat && s !== cat) return false;

    return true;
  });
}

function resetFiltros() {
  filtros.value.inicio = "";
  filtros.value.fim = "";
  filtros.value.categoria = "";
  q.value = "";
  load();
}

onMounted(load);
</script>
