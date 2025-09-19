<script setup>
import { ref, onMounted } from 'vue'
import http from '@/lib/http'

const producaoHoje = ref(null)   // litros
const totalAnimais = ref(null)   // quantidade
const receitaMes   = ref(null)   // R$
const despesasMes  = ref(null)   // R$
const loading      = ref(true)
const erro         = ref('')

onMounted(loadDashboard)

async function loadDashboard () {
  loading.value = true
  erro.value = ''
  try {
    await Promise.all([
      loadAnimais(),
      loadLeiteHoje(),
      loadReceitaMes(),
      loadDespesasMes(),
    ])
  } catch (e) {
    // não derrubar a tela; só exibir mensagem genérica
    console.error(e)
    erro.value = e?.response?.data?.message || e.message || 'Falha ao carregar o dashboard.'
  } finally {
    loading.value = false
  }
}

// --- Helpers de data ---
function hojeISO () {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function rangeMesAtual () {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0) // último dia
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return { inicio: toISO(start), fim: toISO(end) }
}
function isInMonth (isoDate) {
  if (!isoDate) return false
  const { inicio, fim } = rangeMesAtual()
  return isoDate >= inicio && isoDate <= fim
}

// --- Loaders individuais ---
async function loadAnimais () {
  try {
    const r = await http.get('/vacas')
    const arr = Array.isArray(r.data) ? r.data : (r.data?.data || [])
    totalAnimais.value = arr.length
  } catch (e) {
    totalAnimais.value = null // deixa “—” se falhar
  }
}

async function loadLeiteHoje () {
  try {
    const hoje = hojeISO()
    const r = await http.post('/somaleite', { data_inicio: hoje, data_fim: hoje })
    // aceita vários formatos de retorno do back
    const raw = (typeof r.data === 'number')
      ? r.data
      : (r.data?.total ?? r.data?.soma ?? r.data?.litros ?? null)
    producaoHoje.value = toNum(raw)
  } catch (e) {
    producaoHoje.value = null
  }
}

async function loadReceitaMes () {
  try {
    const r = await http.get('/lucros')
    const itens = Array.isArray(r.data) ? r.data : (r.data?.data || [])
    const soma = itens.reduce((acc, it) => {
      if (!isInMonth(it.data_receita)) return acc
      let v = toNum(it.valor_total)
      if (v == null) {
        const q = toNum(it.quantidade) ?? 0
        const pu = toNum(it.preco_unitario) ?? 0
        v = q * pu
      }
      return acc + (v ?? 0)
    }, 0)
    receitaMes.value = soma
  } catch (e) {
    receitaMes.value = null
  }
}

async function loadDespesasMes () {
  try {
    const r = await http.get('/despesas')
    const itens = Array.isArray(r.data) ? r.data : (r.data?.data || [])
    const soma = itens.reduce((acc, it) => {
      if (!isInMonth(it.data_despesa)) return acc
      let v = toNum(it.valor_total)
      if (v == null) {
        const q = toNum(it.quantidade) ?? 0
        const pu = toNum(it.preco_unitario) ?? 0
        v = q * pu
      }
      return acc + (v ?? 0)
    }, 0)
    despesasMes.value = soma
  } catch (e) {
    despesasMes.value = null
  }
}

// --- Utils numéricos/formatadores ---
function toNum (v) {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function fmtBRL (n) {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtNumero (n) {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR')
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="erro" class="text-red-600 text-sm">{{ erro }}</div>

    <!-- Cards resumo -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Produção (L) hoje</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">
          {{ loading ? '...' : fmtNumero(producaoHoje) }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Animais</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">
          {{ loading ? '...' : fmtNumero(totalAnimais) }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Receita (R$) mês</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">
          {{ loading ? '...' : fmtBRL(receitaMes) }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Despesas (R$) mês</div>
        <div class="mt-1 text-2xl font-semibold text-red-600">
          {{ loading ? '...' : fmtBRL(despesasMes) }}
        </div>
      </div>
    </section>

    <!-- Área principal (placeholder por enquanto) -->
    <section class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Resumo de Produção</h2>
          <button class="text-sm text-green-600 hover:text-green-700">Ver detalhes</button>
        </div>
        <div class="h-56 grid place-content-center text-gray-400">(gráfico aqui)</div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Atividades recentes</h2>
          <button class="text-sm text-green-600 hover:text-green-700">Ver tudo</button>
        </div>
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-sm text-gray-700">Teste (colocar atvidades Reais Atualizadas)</span>
          </li>
          <li class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-sm text-gray-700">Teste (colocar atvidades Reais Atualizadas)</span>
          </li>
          <li class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-sm text-gray-700">Teste (colocar atvidades Reais Atualizadas)</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
