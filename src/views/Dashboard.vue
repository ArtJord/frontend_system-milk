<script setup>
import { ref, onMounted } from "vue";
import http from "@/lib/http";

// helpers de data 
function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const producaoHoje = ref(null); 
const totalAnimais = ref(null); 
const receitaMes = ref(null); 
const despesasMes = ref(null); 
const loading = ref(true);
const erro = ref("");

const resumoProducao = ref([]);       
const atividadesRecentes = ref([]);

function addDays(iso, delta) {
  const d = new Date(iso);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
function toBR(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

onMounted(async () => {
  await loadDashboard();
  await Promise.all([loadResumoProducao(), loadAtividades()]);
});

async function loadDashboard() {
  loading.value = true;
  erro.value = "";
  try {
    await Promise.all([
      loadAnimais(),
      loadLeiteHoje(),
      loadReceitaMes(),
      loadDespesasMes(),
    ]);
  } catch (e) {
   
    console.error(e);
    erro.value =
      e?.response?.data?.message || e.message || "Falha ao carregar o dashboard.";
  } finally {
    loading.value = false;
  }
}


async function loadAtividades() {
  try {
    const fim = hojeISO();
    const ini = addDays(fim, -7);

    const [aLeite, aLucro, aDespesa, aAnimal] = await Promise.allSettled([
      http.get("/leites",   { params: { inicio: ini, fim } }),
      http.get("/lucros",   { params: { inicio: ini, fim } }),
      http.get("/despesas", { params: { inicio: ini, fim } }),
      http.get("/vacas"),
    ]);

    const rows = [];

    // Leite
    if (aLeite.status === "fulfilled") {
      const list = Array.isArray(aLeite.value.data)
        ? aLeite.value.data
        : (aLeite.value.data?.leites || []);
      list.slice(-10).forEach((it) => {
        const quando = it.created_at || it.data_ordenha || it.data || it.data_leite;
        const litros = Number(it.litros ?? it.quantidade ?? 0) || 0;
        rows.push({
          ts: quando ? new Date(quando).getTime() : 0,
          titulo: "Cadastro de leite",
          subtitulo: `${toBR(String(quando).slice(0, 10))} • ${fmtNumero(litros)} L`,
          quando: quando ? toBR(String(quando).slice(0, 10)) : "—",
        });
      });
    }

    // Lucro
    if (aLucro.status === "fulfilled") {
      const list = aLucro.value?.data?.lucros ?? aLucro.value?.data ?? [];
      list.slice(-10).forEach((it) => {
        const quando = it.created_at || it.data_receita;
        const total =
          Number(it.valor_total ??
            (Number(it.quantidade || 0) * Number(it.preco_unitario || 0))) || 0;
        rows.push({
          ts: quando ? new Date(quando).getTime() : 0,
          titulo: "Cadastro de lucro",
          subtitulo: `${toBR(String(quando).slice(0, 10))} • ${fmtBRL(total)}`,
          quando: quando ? toBR(String(quando).slice(0, 10)) : "—",
        });
      });
    }

    // Despesa
    if (aDespesa.status === "fulfilled") {
      const list = aDespesa.value?.data?.despesas ?? aDespesa.value?.data ?? [];
      list.slice(-10).forEach((it) => {
        const quando = it.created_at || it.data_despesa;
        const total =
          Number(it.valor_total ??
            (Number(it.quantidade || 0) * Number(it.preco_unitario || 0))) || 0;
        rows.push({
          ts: quando ? new Date(quando).getTime() : 0,
          titulo: "Cadastro de despesa",
          subtitulo: `${toBR(String(quando).slice(0, 10))} • ${fmtBRL(total)}`,
          quando: quando ? toBR(String(quando).slice(0, 10)) : "—",
        });
      });
    }

    // Animal
    if (aAnimal.status === "fulfilled") {
      const list = Array.isArray(aAnimal.value.data)
        ? aAnimal.value.data
        : (aAnimal.value.data?.data || []);
      list.slice(-10).forEach((it) => {
        const quando = it.created_at || it.atualizado_em || it.data_nascimento;
        rows.push({
          ts: quando ? new Date(quando).getTime() : 0,
          titulo: "Cadastro de animal",
          subtitulo: `${it.numero_animal || "—"} • ${it.nome_animal || "Sem nome"}`,
          quando: quando ? toBR(String(quando).slice(0, 10)) : "—",
        });
      });
    }

    atividadesRecentes.value = rows.sort((a, b) => b.ts - a.ts).slice(0, 8);
  } catch (e) {
    console.warn("Falha em atividades recentes:", e?.response || e);
    atividadesRecentes.value = [];
  }
}

// --- Helpers de data ---
function normalizeDateLike(v) {
  if (!v) return null;
  const s = String(v);
  // pega só YYYY-MM-DD
  const d = s.length >= 10 ? s.slice(0, 10) : s;
  // validação simples
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}
function rangeMesAtual() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { inicio: toISO(start), fim: toISO(end) };
}
function isInMonth(dateLike) {
  const d = normalizeDateLike(dateLike);
  if (!d) return false;
  const { inicio, fim } = rangeMesAtual();
  return d >= inicio && d <= fim;
}

// --- Loaders individuais ---
async function loadAnimais() {
  try {
    const r = await http.get("/vacas");
    const arr = Array.isArray(r.data) ? r.data : r.data?.data || [];
    totalAnimais.value = arr.length;
  } catch (e) {
    totalAnimais.value = null; 
  }
}

async function loadLeiteHoje() {
  try {
    const hoje = hojeISO();

    // Tentativa principal: POST /somaleite { data_inicio, data_fim }
    try {
      const r = await http.post("/somaleite", {
        data_inicio: hoje,
        data_fim: hoje,
      });
      const raw =
        typeof r.data === "number"
          ? r.data
          : r.data?.total_leite ?? null; // <- chave correta do back
      if (raw != null) {
        producaoHoje.value = toNum(raw);
        return;
      }
    } catch (_) {
      // segue para o fallback
    }

    // Fallback: GET /allleite (sem filtro) e somar no client
    try {
      const { data } = await http.get("/allleite");
      const arr = Array.isArray(data?.leites) ? data.leites : Array.isArray(data) ? data : [];
      const soma = arr.reduce((acc, it) => {
        const dia = String(it.data_producao || "").slice(0, 10);
        if (dia !== hoje) return acc;
        const litros = toNum(it.quantidade_litros) ?? 0; // <- campo correto
        return acc + litros;
      }, 0);
      producaoHoje.value = soma;
      return;
    } catch (_) {}

    producaoHoje.value = 0; // último recurso
  } catch (e) {
    console.warn("loadLeiteHoje falhou:", e?.response || e);
    producaoHoje.value = null;
  }
}

async function loadReceitaMes() {
  try {
    const r = await http.get("/lucros");
    // aceita /lucros, {lucros:[]}, {data:[]}, item único etc
    const base =
      (Array.isArray(r.data) && r.data) ||
      r.data?.lucros ||
      r.data?.data ||
      (r.data?.lucro ? [r.data.lucro] : []) ||
      [];

    const soma = base.reduce((acc, it) => {
      // datas possíveis
      const d =
        it.data_receita ?? it.data ?? it.created_at ?? it.updated_at ?? null;
      if (!isInMonth(d)) return acc;

      // valor pode vir pronto ou calculado
      let v = toNum(it.valor_total);
      if (v == null) {
        const q = toNum(it.quantidade) ?? 0;
        const pu = toNum(it.preco_unitario) ?? 0;
        v = q * pu;
      }
      return acc + (v ?? 0);
    }, 0);

    receitaMes.value = soma;
  } catch (e) {
    console.warn("loadReceitaMes falhou:", e?.response || e);
    receitaMes.value = null;
  }
}

async function loadDespesasMes() {
  try {
    const r = await http.get("/despesas");
    const base =
      (Array.isArray(r.data) && r.data) ||
      r.data?.despesas ||
      r.data?.data ||
      (r.data?.despesa ? [r.data.despesa] : []) ||
      [];

    const soma = base.reduce((acc, it) => {
      const d =
        it.data_despesa ?? it.data ?? it.created_at ?? it.updated_at ?? null;
      if (!isInMonth(d)) return acc;

      let v = toNum(it.valor_total);
      if (v == null) {
        const q = toNum(it.quantidade) ?? 0;
        const pu = toNum(it.preco_unitario) ?? 0;
        v = q * pu;
      }
      return acc + (v ?? 0);
    }, 0);

    despesasMes.value = soma;
  } catch (e) {
    console.warn("loadDespesasMes falhou:", e?.response || e);
    despesasMes.value = null;
  }
}

async function loadResumoProducao() {
  const fim = hojeISO();
  const ini = addDays(fim, -6);

  const dias = Array.from({ length: 7 }, (_, i) => addDays(ini, i));
  const map = new Map(dias.map((d) => [d, { litros: 0, turnos: new Set() }]));

  try {
    // 1) Se você por acaso vier a criar /leites?inicio&fim no futuro, isso já cobre:
    try {
      const { data } = await http.get("/leites", { params: { inicio: ini, fim } });
      const arr = Array.isArray(data) ? data : data?.leites || data?.data || [];
      arr.forEach((it) => {
        const dia = normalizeDateLike(it.data_ordenha ?? it.data ?? it.data_leite);
        if (!dia || !map.has(dia)) return;
        const litros = toNum(it.litros ?? it.quantidade ?? it.volume) ?? 0;
        const turno = String(it.turno ?? it.periodo ?? "").trim();
        const rec = map.get(dia);
        rec.litros += litros;
        if (turno) rec.turnos.add(turno);
      });
    } catch {
      // 2) Fallback real do seu back: /allleite sem filtro, filtra local por data_producao
      const { data } = await http.get("/allleite");
      const arr = Array.isArray(data?.leites) ? data.leites : Array.isArray(data) ? data : [];
      arr.forEach((it) => {
        const dia = normalizeDateLike(it.data_producao);
        if (!dia || !map.has(dia)) return;
        const litros = toNum(it.quantidade_litros) ?? 0;
        const turno = String(it.turno ?? "").trim(); // se existir
        const rec = map.get(dia);
        rec.litros += litros;
        if (turno) rec.turnos.add(turno);
      });
    }
  } finally {
    resumoProducao.value = dias.map((d) => ({
      data: d,
      dataBR: toBR(d),
      litros: map.get(d)?.litros ?? 0,
      turnos: Array.from(map.get(d)?.turnos ?? []),
    }));
  }
}

// --- Utils numéricos/formatadores ---
function toNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function fmtBRL(n) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtNumero(n) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR");
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
          {{ loading ? "..." : fmtNumero(producaoHoje) }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Animais</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">
          {{ loading ? "..." : fmtNumero(totalAnimais) }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Receita (R$) mês</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900">
          {{ loading ? "..." : fmtBRL(receitaMes) }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="text-sm text-gray-500">Despesas (R$) mês</div>
        <div class="mt-1 text-2xl font-semibold text-red-600">
          {{ loading ? "..." : fmtBRL(despesasMes) }}
        </div>
      </div>
    </section>

    <!-- Área principal -->
    <section class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- Resumo de Produção (últimos 7 dias) -->
      <div class="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Resumo de Produção</h2>
          <button class="text-sm text-green-600 hover:text-green-700">Ver detalhes</button>
        </div>

        <div v-if="!resumoProducao.length" class="h-56 grid place-content-center text-gray-400">
          Sem dados nesse período
        </div>
        <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="px-4 py-2 font-medium">Data</th>
                <th class="px-4 py-2 font-medium text-right">Litros</th>
                <th class="px-4 py-2 font-medium">Turnos</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in resumoProducao"
                :key="d.data"
                class="border-b last:border-0"
              >
                <td class="px-4 py-2">{{ d.dataBR }}</td>
                <td class="px-4 py-2 text-right">{{ fmtNumero(d.litros) }}</td>
                <td class="px-4 py-2">{{ d.turnos.length ? d.turnos.join(', ') : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Atividades recentes -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Atividades recentes</h2>
          <button class="text-sm text-green-600 hover:text-green-700">Ver tudo</button>
        </div>

        <div v-if="!atividadesRecentes.length" class="h-56 grid place-content-center text-gray-400">
          Sem atividades recentes
        </div>
        <ul v-else class="divide-y">
          <li
            v-for="(a, i) in atividadesRecentes"
            :key="i"
            class="py-2 flex items-start gap-3"
          >
            <span class="mt-2 w-2 h-2 rounded-full bg-green-500"></span>
            <div class="min-w-0">
              <div class="text-sm text-gray-900 truncate">{{ a.titulo }}</div>
              <div class="text-xs text-gray-500 truncate">{{ a.subtitulo }}</div>
            </div>
            <div class="ml-auto text-xs text-gray-400 whitespace-nowrap">{{ a.quando }}</div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
