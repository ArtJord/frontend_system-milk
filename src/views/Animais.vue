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

    <!-- Estados -->
    <div v-if="loading" class="py-10 text-center text-gray-500">Carregando...</div>
    <div v-else-if="error" class="py-3 text-red-600">{{ error }}</div>

    <!-- Grid de cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      <div
        v-for="a in filtered"
        :key="a.id || a.id_vaca || a.numero_animal"
        class="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <!-- Botão redondo de editar -->
        <button
          class="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-green-600 hover:text-white transition"
          @click="openEdit(a)"
          :title="`Editar ${a.nome_animal || ''}`"
        >
          <Pencil class="h-4 w-4" />
        </button>

        <div class="flex items-start justify-between mb-2">
          <div class="text-xs text-gray-500">Nº {{ a.numero_animal || '—' }}</div>
          <Milk class="h-4 w-4 text-green-600" />
        </div>

        <h3 class="text-lg font-semibold text-gray-900 leading-tight">
          {{ a.nome_animal || 'Sem nome' }}
        </h3>
        <p class="text-sm text-gray-500">{{ a.raca || '—' }}</p>

        <dl class="mt-3 grid grid-cols-2 gap-y-1 text-sm text-gray-700">
          <dt class="text-gray-500">Sexo</dt>
          <dd>{{ a.sexo || '—' }}</dd>

          <dt class="text-gray-500">Nascimento</dt>
          <dd>{{ formatDate(a.data_nascimento) }}</dd>

          <dt class="text-gray-500">Peso (kg)</dt>
          <dd>{{ a.peso_kg ?? '—' }}</dd>

          <dt class="text-gray-500">Cor</dt>
          <dd>{{ a.cor || '—' }}</dd>

          <dt class="text-gray-500">Status</dt>
          <dd>{{ a.statuss || '—' }}</dd>
        </dl>

        <p v-if="a.observacoes" class="mt-3 text-sm text-gray-600">
          {{ a.observacoes }}
        </p>
      </div>
    </div>

    <!-- Modal criar/editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
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
                <label class="text-sm text-gray-700">Número do animal <span class="text-red-600">*</span></label>
                <input
                  v-model="form.numero_animal"
                  placeholder="Ex.: A001"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.numero_animal" class="text-xs text-red-600 mt-1">{{ errors.numero_animal }}</p>
              </div>

              <div>
                <label class="text-sm text-gray-700">Nome <span class="text-red-600">*</span></label>
                <input
                  v-model="form.nome_animal"
                  placeholder="Ex.: Estrela"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p v-if="errors.nome_animal" class="text-xs text-red-600 mt-1">{{ errors.nome_animal }}</p>
              </div>
            </div>
          </section>

          <!-- Características -->
          <section class="space-y-3 mt-6">
            <h4 class="text-sm font-semibold text-gray-800">Características</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700">Raça <span class="text-red-600">*</span></label>
                <select
                  v-model="form.raca"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>Selecione...</option>
                  <option v-for="r in RACAS" :key="r" :value="r">{{ r }}</option>
                </select>
                <p v-if="errors.raca" class="text-xs text-red-600 mt-1">{{ errors.raca }}</p>
              </div>

              <div>
                <label class="text-sm text-gray-700 block">Sexo <span class="text-red-600">*</span></label>
                <div class="mt-2 flex gap-4">
                  <label class="inline-flex items-center gap-2">
                    <input type="radio" value="F" v-model="form.sexo" class="accent-green-600" />
                    <span>Fêmea</span>
                  </label>
                  <label class="inline-flex items-center gap-2">
                    <input type="radio" value="M" v-model="form.sexo" class="accent-green-600" />
                    <span>Macho</span>
                  </label>
                </div>
                <p v-if="errors.sexo" class="text-xs text-red-600 mt-1">{{ errors.sexo }}</p>
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
                  type="number" step="0.01" min="0"
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
                <label class="text-sm text-gray-700">Status <span class="text-red-600">*</span></label>
                <select
                  v-model="form.statuss"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>Selecione...</option>
                  <option v-for="s in STATUSS" :key="s" :value="s">{{ s }}</option>
                </select>
                <p v-if="errors.statuss" class="text-xs text-red-600 mt-1">{{ errors.statuss }}</p>
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
                  type="number" step="0.01" min="0"
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

        <div class="sticky bottom-0 flex items-center justify-end gap-2 border-t px-5 py-3">
          <button @click="closeCreate" class="rounded-lg px-4 py-2 hover:bg-gray-100">Cancelar</button>
          <button
            :disabled="saving"
            @click="submit"
            class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {{ saving ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Salvar') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, X, Milk, Pencil } from 'lucide-vue-next'
import http from '@/lib/http'

//teste
const REQUIRED_ON_UPDATE = ['numero_animal']


// Endpoints
const LIST_ENDPOINT = '/vacas'   // GET (listar)
const CREATE_ENDPOINT = '/vaca'  // POST (criar)

// Estado base
const loading = ref(false)
const error = ref('')
const items = ref([])
const q = ref('')

// Enums (CHECK do PostgreSQL)
const RACAS = ['Holandesa','Jersey','Girolando','Gir','Nelore','Angus','Simental','Outros']
const ESTADOS_SAUDE = ['Excelente','Boa','Regular','Ruim','Crítica']
const STATUSS = ['Ativa','Prenha Seca','Doente','Vendida']
const STATUS_REPRO = ['Vazia','Prenha','Seca','Lactante','No Cio']

// Modal / edição
const showModal = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const modalTitle = computed(() => (isEditing.value ? 'Editar animal' : 'Cadastrar animal'))

// Form & snapshot (para diff/validação condicional)
const blankForm = () => ({
  numero_animal: '',
  nome_animal: '',
  raca: '',
  sexo: '', // 'M' | 'F'
  data_nascimento: '',
  peso_kg: null,
  cor: '',
  statuss: '',
  estado_saude: '',
  ultima_vacinacao: '',
  proxima_vacinacao: '',
  status_reprodutivo: '',
  producao_diaria_litros: null,
  observacoes: '',
})
const form = ref(blankForm())
const originalForm = ref(null) // snapshot ao abrir edição

const errors = ref({
  numero_animal: '',
  nome_animal: '',
  raca: '',
  sexo: '',
  statuss: '',
})

// Filtro
const filtered = computed(() => {
  if (!q.value) return items.value
  const s = q.value.toLowerCase()
  return items.value.filter(a =>
    String(a.numero_animal || '').toLowerCase().includes(s) ||
    String(a.nome_animal || '').toLowerCase().includes(s)
  )
})

// Utils
function formatDate (v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return v
    return d.toLocaleDateString('pt-BR')
  } catch { return v }
}
const changed = (key) => {
  if (!isEditing.value || !originalForm.value) return true // em criação, considere "mudou" p/ validar tudo
  return form.value[key] !== originalForm.value[key]
}

// Carregar lista
async function load () {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get(LIST_ENDPOINT)
    items.value = Array.isArray(r.data) ? r.data : (r.data?.data || [])
  } catch (e) {
    error.value = e?.response?.data?.message || 'Não foi possível carregar os animais.'
  } finally {
    loading.value = false
  }
}

// Abrir/criar
function openCreate () {
  isEditing.value = false
  editingId.value = null
  originalForm.value = null
  form.value = blankForm()
  errors.value = { numero_animal: '', nome_animal: '', raca: '', sexo: '', statuss: '' }
  showModal.value = true
}

// Fechar modal
function closeCreate () {
  showModal.value = false
  isEditing.value = false
  editingId.value = null
  originalForm.value = null
  form.value = blankForm()
  errors.value = { numero_animal: '', nome_animal: '', raca: '', sexo: '', statuss: '' }
}

// Abrir/editar
function openEdit (animal) {
  const id = animal?.id ?? animal?.id_vaca ?? animal?.idAnimal ?? null
  editingId.value = id
  isEditing.value = true

  const filled = {
    numero_animal: animal.numero_animal ?? '',
    nome_animal:   animal.nome_animal ?? '',
    raca:          animal.raca ?? '',
    sexo:          animal.sexo ?? '',
    data_nascimento:        animal.data_nascimento ?? '',
    peso_kg:                animal.peso_kg ?? null,
    cor:                    animal.cor ?? '',
    statuss:                animal.statuss ?? '',
    estado_saude:           animal.estado_saude ?? '',
    ultima_vacinacao:       animal.ultima_vacinacao ?? '',
    proxima_vacinacao:      animal.proxima_vacinacao ?? '',
    status_reprodutivo:     animal.status_reprodutivo ?? '',
    producao_diaria_litros: animal.producao_diaria_litros ?? null,
    observacoes:            animal.observacoes ?? ''
  }

  form.value = { ...filled }
  originalForm.value = { ...filled } // snapshot para diff/validação
  errors.value = { numero_animal: '', nome_animal: '', raca: '', sexo: '', statuss: '' }
  showModal.value = true
}

// Validação (condicional na edição)
function validate () {
  errors.value = { numero_animal: '', nome_animal: '', raca: '', sexo: '', statuss: '' }
  let ok = true

  // número
  if (!isEditing.value || changed('numero_animal')) {
    if (!form.value.numero_animal?.trim()) {
      errors.value.numero_animal = 'Número do animal é obrigatório.'
      ok = false
    }
  }
  // nome
  if (!isEditing.value || changed('nome_animal')) {
    if (!form.value.nome_animal?.trim()) {
      errors.value.nome_animal = 'Nome é obrigatório.'
      ok = false
    }
  }
  // raca
  if (!isEditing.value || changed('raca')) {
    if (!form.value.raca || !RACAS.includes(form.value.raca)) {
      errors.value.raca = 'Selecione uma raça válida.'
      ok = false
    }
  }
  // sexo
  if (!isEditing.value || changed('sexo')) {
    if (!['M','F'].includes(form.value.sexo)) {
      errors.value.sexo = 'Selecione o sexo (M ou F).'
      ok = false
    }
  }
  // statuss
  if (!isEditing.value || changed('statuss')) {
    if (!form.value.statuss || !STATUSS.includes(form.value.statuss)) {
      errors.value.statuss = 'Selecione um status válido.'
      ok = false
    }
  }

  return ok
}

// Enviar (criar/editar)
async function submit () {
  if (!validate()) return
  saving.value = true
  try {
    if (isEditing.value) {
      if (!editingId.value) throw new Error('ID do animal não encontrado para editar.')

      // monta diff: só campos que mudaram
      const diff = {}
      Object.keys(form.value).forEach((k) => {
        const vNow = form.value[k]
        const vOld = originalForm.value?.[k]
        if (vNow !== vOld) {
          if (
            vNow === '' ||
            vNow === null ||
            (typeof vNow === 'string' && vNow.trim() === '') ||
            (typeof vNow === 'number' && Number.isNaN(vNow))
          ) return
          diff[k] = vNow
        }
      })

      // ✅ garanta campos obrigatórios no PUT (mesmo sem mudança)
      REQUIRED_ON_UPDATE.forEach((k) => {
        const v = form.value[k]
        if (
          v !== undefined &&
          v !== null &&
          !(typeof v === 'string' && v.trim() === '')
        ) {
          diff[k] = v
        }
      })

      // se nada mudou e nenhum obrigatório foi incluído, apenas fecha
      if (Object.keys(diff).length === 0) {
        closeCreate()
        return
      }

      const resp = await http.put(`/vaca/${editingId.value}`, diff)
      if (resp.status === 200) {
        closeCreate()
        await load()
      } else {
        alert('Não foi possível salvar as alterações.')
      }
    } else {
      // criação
      const payload = { ...form.value }
      Object.keys(payload).forEach((k) => {
        const v = payload[k]
        if (
          v === '' ||
          v === null ||
          (typeof v === 'string' && v.trim() === '') ||
          (typeof v === 'number' && Number.isNaN(v))
        ) {
          delete payload[k]
        }
      })
      const resp = await http.post(CREATE_ENDPOINT, payload)
      if (resp.status === 200 || resp.status === 201) {
        closeCreate()
        await load()
      } else {
        alert('Não foi possível cadastrar.')
      }
    }
  } catch (e) {
    alert(e?.response?.data?.message ?? (isEditing.value ? 'Erro ao editar animal.' : 'Erro ao cadastrar animal.'))
  } finally {
    saving.value = false
  }
}


onMounted(load)
</script>
