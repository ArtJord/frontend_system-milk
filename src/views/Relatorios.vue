<template>
  <div class="w-full">
    <!-- Toast -->
    <div
      v-if="showToast"
      class="fixed top-5 right-5 z-50 rounded-lg px-4 py-2 text-white shadow-lg transition-all"
      :class="{
        'bg-green-600/95': toastType === 'success',
        'bg-red-600/95': toastType === 'error',
        'bg-yellow-500/95': toastType === 'warning',
      }"
      role="status"
      aria-live="polite"
    >
      {{ toastMessage }}
    </div>

    <!-- Header -->
    <div
      class="rounded-2xl bg-gradient-to-r from-green-50 to-white border p-5 mb-5 flex items-center gap-3"
    >
      <BarChart3 class="h-7 w-7 text-green-600" />
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Relatórios do Sistema</h2>
        <p class="text-sm text-gray-600">
          Resumo diário, semanal e mensal de animais, leite, lucros e despesas.
        </p>
      </div>
      <div class="ml-auto">
        <span
          class="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-sm text-gray-700"
        >
          <Calendar class="h-4 w-4" />
          {{ periodoTexto }}
        </span>
      </div>
    </div>

    <!-- Cards de Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div class="rounded-2xl border bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">Animais</div>
          <Users class="h-5 w-5 text-green-600" />
        </div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ resumo.animais }}</div>
        <div class="text-xs text-gray-500">Cadastros no período</div>
      </div>

      <div class="rounded-2xl border bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">Leite</div>
          <Droplets class="h-5 w-5 text-green-600" />
        </div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">
          {{ resumo.leiteLitros.toLocaleString("pt-BR") }} L
        </div>
        <div class="text-xs text-gray-500">Produção no período</div>
      </div>

      <div class="rounded-2xl border bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">Lucros</div>
          <Wallet class="h-5 w-5 text-green-600" />
        </div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">
          R$
          {{ resumo.lucrosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) }}
        </div>
        <div class="text-xs text-gray-500">Recebido no período</div>
      </div>

      <div class="rounded-2xl border bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">Despesas</div>
          <Receipt class="h-5 w-5 text-green-600" />
        </div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">
          R$
          {{ resumo.despesasTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) }}
        </div>
        <div class="text-xs text-gray-500">Gasto no período</div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="rounded-2xl border bg-white p-4 shadow-sm mb-6">
      <div class="mb-4 flex items-center gap-2 text-gray-700">
        <Filter class="h-4 w-4" />
        <span class="text-sm font-medium">Filtros</span>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div class="col-span-2">
          <label class="block text-sm text-gray-600 mb-1">Tipo de Relatório</label>
          <select
            v-model="filtro.tipo"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="tudo">Tudo</option>
            <option value="animais">Cadastro de Animais</option>
            <option value="leite">Cadastro de Leite</option>
            <option value="lucros">Cadastro de Lucros</option>
            <option value="despesas">Cadastro de Despesas</option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">Periodicidade</label>
          <select
            v-model="filtro.periodicidade"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        <!-- Datas -->
        <div v-if="filtro.periodicidade === 'diario'">
          <label class="block text-sm text-gray-600 mb-1">Dia</label>
          <div class="relative">
            <Calendar
              class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="date"
              v-model="ui.dateDia"
              class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        <div v-else-if="filtro.periodicidade === 'semanal'">
          <label class="block text-sm text-gray-600 mb-1"
            >Data de referência (semana)</label
          >
          <div class="relative">
            <CalendarRange
              class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="date"
              v-model="ui.dateSemana"
              class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        <div v-else-if="filtro.periodicidade === 'mensal'">
          <label class="block text-sm text-gray-600 mb-1">Mês</label>
          <div class="relative">
            <Calendar
              class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="month"
              v-model="ui.dateMes"
              class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        <div v-else class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm text-gray-600 mb-1">De</label>
            <div class="relative">
              <Calendar
                class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="date"
                v-model="ui.rangeDe"
                class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Até</label>
            <div class="relative">
              <Calendar
                class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="date"
                v-model="ui.rangeAte"
                class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>
        </div>

        <div class="flex items-end">
          <button
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 w-full disabled:opacity-60"
            :disabled="loading"
            @click="gerar"
            title="Gerar PDF"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Nota do período -->
    <div class="rounded-2xl border bg-white p-4 text-sm text-gray-600">
      <span class="font-medium text-gray-900">Período selecionado: </span
      >{{ periodoTexto }}
      <span class="text-gray-500 block"
        >*O PDF será gerado com base no período e tipo escolhidos.</span
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import http from "@/lib/http";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart3,
  Calendar,
  CalendarRange,
  Download,
  Loader2,
  Users,
  Droplets,
  Wallet,
  Receipt,
  Filter,
} from "lucide-vue-next";

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
function toast(msg, type = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2000);
}

const loading = ref(false);

const filtro = ref({
  tipo: "tudo", // animais | leite | lucros | despesas | tudo
  periodicidade: "personalizado", // diario | semanal | mensal | personalizado
});

const ui = ref({
  dateDia: new Date().toISOString().slice(0, 10),
  dateSemana: new Date().toISOString().slice(0, 10),
  dateMes: new Date().toISOString().slice(0, 7),
  // defaults conforme seu print:
  rangeDe: "2025-07-02",
  rangeAte: new Date().toISOString().slice(0, 10),
});

// === cálculo do período ===
const periodo = computed(() => {
  const toISO = (d) =>
    d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);

  if (filtro.value.periodicidade === "diario") {
    const d = ui.value.dateDia || new Date().toISOString().slice(0, 10);
    return { ini: d, fim: d };
  }
  if (filtro.value.periodicidade === "semanal") {
    const d = new Date(ui.value.dateSemana || new Date());
    const day = d.getUTCDay() || 7; // 1..7 (segunda=1)
    const monday = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (day - 1))
    );
    const sunday = new Date(
      Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6)
    );
    return { ini: toISO(monday), fim: toISO(sunday) };
  }
  if (filtro.value.periodicidade === "mensal") {
    const [y, m] = (ui.value.dateMes || new Date().toISOString().slice(0, 7))
      .split("-")
      .map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const last = new Date(Date.UTC(y, m, 0));
    return { ini: toISO(first), fim: toISO(last) };
  }
  // personalizado
  const ini = ui.value.rangeDe || new Date().toISOString().slice(0, 10);
  const fim = ui.value.rangeAte || ui.value.rangeDe;
  return { ini, fim };
});
const periodoTexto = computed(() => `${periodo.value.ini} → ${periodo.value.fim}`);

// === ENDPOINTS ===
async function fetchAnimais() {
  const { data } = await http.get("/vacas");
  return Array.isArray(data) ? data : data?.vacas ?? [];
}
async function fetchLeite() {
  const { data } = await http.get("/allleite");
  return Array.isArray(data) ? data : data?.leites ?? [];
}
async function fetchLucros() {
  const { data } = await http.get("/lucros");
  return Array.isArray(data) ? data : data?.lucros ?? [];
}
async function fetchDespesas() {
  const { data } = await http.get("/despesas");
  return Array.isArray(data) ? data : data?.despesas ?? [];
}

// === Helpers ===
function dentroDoPeriodo(isoDate, ini, fim) {
  if (!isoDate) return false;
  const d = String(isoDate).slice(0, 10);
  return d >= ini && d <= fim;
}
function filtrarColecao(arr, campoData, ini, fim) {
  return arr.filter((r) => dentroDoPeriodo(r[campoData], ini, fim));
}
function soma(arr, getter) {
  return arr.reduce((acc, x) => acc + (Number(getter(x)) || 0), 0);
}
function valorTotalRegistro(x) {
  if (x?.valor_total != null) return Number(x.valor_total);
  const q = Number(x?.quantidade || 0);
  const p = Number(x?.preco_unitario || 0);
  return q * p;
}
function gerarTabela(doc, titulo, head, rows, startAt) {
  const startY = typeof startAt === "number"
    ? startAt
    : (doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 14 : 180);

  doc.setFontSize(12);
  const titleY = startY - 10;
  doc.text(titulo, 40, titleY);

  autoTable(doc, {
    head: [head],
    body: rows.length ? rows : [["—", "—", "—", "—", "—"]],
    startY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 40, right: 40 },
  });
}


// === Resumo (cards) ===
const resumo = ref({
  animais: 0,
  leiteLitros: 0,
  lucrosTotal: 0,
  despesasTotal: 0,
});

async function atualizarResumo() {
  const { ini, fim } = periodo.value;
  const tipo = filtro.value.tipo;

  try {
    loading.value = true;

    // Buscar apenas o necessário conforme o tipo selecionado
    const [animais, leites, lucros, despesas] = await Promise.all([
      tipo === "animais" || tipo === "tudo" ? fetchAnimais() : Promise.resolve([]),
      tipo === "leite" || tipo === "tudo" ? fetchLeite() : Promise.resolve([]),
      tipo === "lucros" || tipo === "tudo" ? fetchLucros() : Promise.resolve([]),
      tipo === "despesas" || tipo === "tudo" ? fetchDespesas() : Promise.resolve([]),
    ]);

    const fa = filtrarColecao(animais, "data_nascimento", ini, fim);
    const fl = filtrarColecao(leites, "data_producao", ini, fim);
    const fluc = filtrarColecao(lucros, "data_receita", ini, fim);
    const fdes = filtrarColecao(despesas, "data_despesa", ini, fim);

    resumo.value.animais = fa.length;
    resumo.value.leiteLitros = soma(fl, (x) => x.quantidade_litros);
    resumo.value.lucrosTotal = soma(fluc, (x) => valorTotalRegistro(x));
    resumo.value.despesasTotal = soma(fdes, (x) => valorTotalRegistro(x));
  } catch (e) {
    console.error(e);
    toast("Erro ao atualizar resumo", "error");
  } finally {
    loading.value = false;
  }
}

// Atualiza resumo quando mudar período/tipo
watch(
  [filtro, ui],
  () => {
    atualizarResumo();
  },
  { deep: true }
);
atualizarResumo();

// === Gerar PDF ===
async function gerar() {
  const { ini, fim } = periodo.value;
  const tipo = filtro.value.tipo;

  try {
    loading.value = true;

    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // ===== util p/ timestamp =====
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // ===== HEADER =====
    // linha 1: marca + data
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("System Milk | Relatório", 40, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${ts}`, 555, 40, { align: "right" });

    // linha 2: título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO GERAL", 40, 66);

    // linha 3: tipo e período
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Tipo: ${tipo.toUpperCase()}`, 40, 86);
    doc.text(`Período: ${ini} até ${fim}`, 200, 86);

    // separador
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(40, 100, 555, 100);

    // ===== RESUMO =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumo do período:", 40, 120);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const linhasResumo = [
      `- Animais: ${resumo.value.animais}`,
      `- Leite: ${Number(resumo.value.leiteLitros).toLocaleString("pt-BR")} L`,
      `- Lucros: R$ ${Number(resumo.value.lucrosTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `- Despesas: R$ ${Number(resumo.value.despesasTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ];
    let y = 136;
    linhasResumo.forEach((t) => { doc.text(t, 50, y); y += 14; });

    // divisor final do cabeçalho
    doc.setDrawColor(220);
    doc.line(40, y + 6, 555, y + 6);

    // >>> base dinâmica para a 1ª tabela
    const firstTableStart = y + 24;
    let isFirstSection = true;

    // helper para desenhar seção respeitando a 1ª base
    const addSection = (titulo, head, rows) => {
      if (isFirstSection) {
        gerarTabela(doc, titulo, head, rows, firstTableStart);
        isFirstSection = false;
      } else {
        gerarTabela(doc, titulo, head, rows);
      }
    };

    // ===== TABELAS =====
    if (tipo === "animais" || tipo === "tudo") {
      const animais = await fetchAnimais();
      const fil = filtrarColecao(animais, "data_nascimento", ini, fim);
      const rows = fil.map((a) => [a.id, a.numero_animal ?? "-", a.nome ?? "-", a.raca ?? "-", a.data_nascimento ?? "-"]);
      addSection("Cadastro de Animais", ["ID", "Nº", "Nome", "Raça", "Nascimento"], rows);
    }

    if (tipo === "leite" || tipo === "tudo") {
      const leites = await fetchLeite();
      const fil = filtrarColecao(leites, "data_producao", ini, fim);
      const rows = fil.map((l) => [l.id, l.data_producao ?? "-", l.turno ?? "-", l.quantidade_litros ?? "-", l.responsavel ?? "-"]);
      addSection("Cadastro de Leite", ["ID", "Data", "Turno", "Litros", "Responsável"], rows);
    }

    if (tipo === "lucros" || tipo === "tudo") {
      const lucros = await fetchLucros();
      const fil = filtrarColecao(lucros, "data_receita", ini, fim);
      const rows = fil.map((l) => [
        l.id,
        l.data_receita ?? "-",
        l.categoria ?? "-",
        l.fonte_receita ?? l.cliente ?? "-",
        (valorTotalRegistro(l) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      ]);
      addSection("Cadastro de Lucros", ["ID", "Data", "Categoria", "Fonte/Cliente", "Valor total"], rows);
    }

    if (tipo === "despesas" || tipo === "tudo") {
      const despesas = await fetchDespesas();
      const fil = filtrarColecao(despesas, "data_despesa", ini, fim);
      const rows = fil.map((d) => [
        d.id,
        d.data_despesa ?? "-",
        d.categoria ?? "-",
        d.fornecedor ?? "-",
        (valorTotalRegistro(d) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      ]);
      addSection("Cadastro de Despesas", ["ID", "Data", "Categoria", "Fornecedor", "Valor total"], rows);
    }

    const filename = `relatorio_${tipo}_${ini}_${fim}.pdf`;
    doc.save(filename);
    toast("PDF gerado com sucesso!");
  } catch (e) {
    console.error(e);
    toast("Erro ao gerar relatório", "error");
  } finally {
    loading.value = false;
  }
}


</script>
