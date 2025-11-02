<template>
  <div class="w-full">
    <!-- Toast -->
    <div
      v-if="showToast"
      class="fixed top-5 right-5 z-50 rounded-lg px-4 py-2 text-white shadow-lg transition-all"
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

    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex-1">
        <input
          v-model="q"
          type="text"
          placeholder="Buscar por fornecedor, descrição, categoria, subcategoria ou NF"
          class="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          @click="openCreate"
        >
          Nova despesa
        </button>
      </div>
    </div>

    <!-- Filtros rápidos -->
    <div class="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
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
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
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
              {{ fmtData(item.data_despesa) }} • {{ item.categoria || "—"
              }}<span v-if="item.subcategoria"> / {{ item.subcategoria }}</span>
            </div>
            <div class="mt-1 text-2xl font-semibold text-gray-900">
              R$
              {{
                fmtNumero(
                  item.valor_total ??
                    Number(item.quantidade || 0) * Number(item.preco_unitario || 0)
                )
              }}
            </div>
            <div class="mt-1 text-sm text-gray-700">
              Fornecedor: <span class="font-medium">{{ item.fornecedor || "—" }}</span>
            </div>
            <div class="mt-1 text-xs text-gray-600">
              NF/Despesa: {{ item.numero_despesa || item.numero_nfe || "—" }}
            </div>
            <div class="mt-1 text-xs text-gray-600">
              Prioridade: {{ item.prioridade || "—" }}
            </div>
            <div class="mt-1 text-xs text-gray-600">
              Venc.: {{ fmtData(item.data_vencimento) }} • Pag.:
              {{ fmtData(item.data_pagamento) }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Editar (lápis redondo) -->
            <button
              @click="openEdit(item)"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-green-600 hover:text-white transition"
              title="Editar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>

            <!-- Excluir (lixeira redonda) -->
            <button
              v-if="canDelete"
              @click="openConfirmDelete(item)"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition"
              title="Excluir"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 7h12M9 7V4h6v3m2 0v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          v-if="item.descricao"
          class="mt-3 rounded-md bg-gray-50 p-2 text-sm text-gray-700"
        >
          {{ item.descricao }}
        </div>
        <div v-if="item.observacoes" class="mt-2 text-xs text-gray-600">
          Observações: {{ item.observacoes }}
        </div>
      </div>
    </div>

    <div
      v-if="showConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div class="px-6 py-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-lg font-semibold text-gray-900">Confirmar exclusão</h2>
              <p class="mt-2 text-sm text-gray-600">
                Tem certeza que deseja excluir esta despesa?
              </p>
              <div
                v-if="confirmItem"
                class="mt-4 rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700"
              >
                <div><strong>Data:</strong> {{ fmtData(confirmItem.data_despesa) }}</div>
                <div class="mt-1">
                  <strong>Valor:</strong> R$
                  {{
                    fmtNumero(
                      confirmItem.valor_total ??
                        Number(confirmItem.quantidade || 0) *
                          Number(confirmItem.preco_unitario || 0)
                    )
                  }}
                </div>
                <div class="mt-1">
                  <strong>Fornecedor:</strong> {{ confirmItem.fornecedor || "—" }}
                </div>
              </div>
            </div>
            <button
              @click="cancelConfirm"
              class="ml-3 rounded-md p-2 text-gray-400 hover:bg-gray-50"
              aria-label="Fechar confirmação"
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
              class="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de cadastro/edição -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div class="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? "Editar despesa" : "Nova despesa" }}
          </h3>
          <button
            @click="close"
            class="rounded-md p-1.5 hover:bg-gray-50"
            aria-label="Fechar modal"
          >
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

        <div class="max-h-[75vh] overflow-y-auto px-5 py-4 space-y-6">
          <!-- Dados principais -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Dados principais</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700"
                  >Data da despesa <span class="text-red-600">*</span></label
                >
                <input
                  type="date"
                  v-model="form.data_despesa"
                  required
                  aria-required="true"
                  :aria-invalid="!!errors.data_despesa"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.data_despesa,
                    'border-gray-300': !errors.data_despesa,
                  }"
                />
                <p v-if="errors.data_despesa" class="mt-1 text-xs text-red-600">
                  {{ errors.data_despesa }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-700">Prioridade</label>
                <select
                  v-model="form.prioridade"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="p in PRIORIDADES" :key="p">{{ p }}</option>
                </select>
              </div>

              <div>
                <label class="text-sm text-gray-700">Categoria</label>
                <select
                  v-model="form.categoria"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option v-for="c in CATEGORIAS" :key="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Subcategoria</label>
                <input
                  type="text"
                  v-model="form.subcategoria"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="Ex.: Ração concentrada"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-sm text-gray-700"
                  >Fornecedor <span class="text-red-600">*</span></label
                >
                <input
                  type="text"
                  v-model="form.fornecedor"
                  required
                  aria-required="true"
                  :aria-invalid="!!errors.fornecedor"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.fornecedor,
                    'border-gray-300': !errors.fornecedor,
                  }"
                />

                <p v-if="errors.fornecedor" class="mt-1 text-xs text-red-600">
                  {{ errors.fornecedor }}
                </p>
              </div>

              <div class="md:col-span-2">
                <label class="text-sm text-gray-700">Descrição</label>
                <input
                  type="text"
                  v-model="form.descricao"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700">Número NF/Despesa</label>
                <input
                  type="text"
                  v-model="form.numero_despesa"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>
          </section>

          <!-- Valores -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Valores</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-sm text-gray-700">Quantidade</label>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="form.quantidade"
                  :aria-invalid="!!errors.preco"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.preco,
                    'border-gray-300': !errors.preco,
                  }"
                  placeholder="Ex.: 2"
                />
                <p v-if="errors.preco" class="mt-1 text-xs text-red-600">
                  {{ errors.preco }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-700">Preço unitário</label>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="form.preco_unitario"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="Ex.: 50"
                />
              </div>
              <div>
                <label class="text-sm text-gray-700">Valor total</label>
                <input
                  type="text"
                  :value="fmtNumero((form.quantidade || 0) * (form.preco_unitario || 0))"
                  readonly
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="Calculado automaticamente"
                />
              </div>
            </div>
          </section>

          <!-- Vencimento/Pagamento/Observações -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Vencimento e pagamento</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-700">Data de vencimento</label>
                <input
                  type="date"
                  v-model="form.data_vencimento"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label class="text-sm text-gray-700">Data de pagamento</label>
                <input
                  type="date"
                  v-model="form.data_pagamento"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>
            <div>
              <label class="text-sm text-gray-700">Observações</label>
              <textarea
                v-model="form.observacoes"
                rows="2"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                placeholder="Observações adicionais"
              ></textarea>
            </div>
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
            @click="save"
            class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {{ saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from "vue";
import http from "@/lib/http";
import { formatDateBR } from "@/utils/date";

export default {
  name: "DespesaView",
  setup() {
    // UI state
    const saving = ref(false);
    const q = ref("");
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastType = ref("success");
    const showModal = ref(false);
    const isEditing = ref(false);
    const showConfirm = ref(false);
    const confirmItem = ref(null);
    const errors = reactive({});

    const filtros = ref({ inicio: "", fim: "", categoria: "", prioridade: "" });

    // lista
    const list = ref([]);

    function getUserRole() {
      const byStorage =
        localStorage.getItem("user_cargo") ||
        localStorage.getItem("user_role") ||
        localStorage.getItem("cargo");
      if (byStorage) return String(byStorage).toLowerCase();

      const t = localStorage.getItem("auth_token");
      if (t && t.split?.(".").length === 3) {
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

    const userRole = ref(getUserRole());
    const canDelete = computed(() =>
      ["gerente", "administrador"].includes(userRole.value)
    );

    const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"];
    const CATEGORIAS = [
      "Alimentação",
      "Veterinario",
      "Manutenção",
      "Combustivel",
      "Mão de obra",
      "Insumos",
      "Impostos e taxas",
      "Financeiro",
      "Outros",
    ];

    // toast auto-hide
    watch(showToast, (v) => {
      if (v) setTimeout(() => (showToast.value = false), 3000);
    });

    // form
    const form = reactive({
      id: null,
      numero_despesa: "",
      data_despesa: "",
      prioridade: "",
      categoria: "",
      subcategoria: "",
      descricao: "",
      fornecedor: "",
      quantidade: 0,
      preco_unitario: 0,
      numero_nfe: "",
      data_vencimento: "",
      data_pagamento: "",
      observacoes: "",
    });

    // carregar lista
    const loadList = async () => {
      try {
        const res = await http.get("/despesas", {
          params: {
            inicio: filtros.value.inicio || undefined,
            fim: filtros.value.fim || undefined,
            categoria: filtros.value.categoria || undefined,
            prioridade: filtros.value.prioridade || undefined,
          },
        });
        list.value = res.data?.despesas || res.data || [];
      } catch (err) {
        list.value = [];
        toastMessage.value =
          (err && (err.userMessage || err.message)) ||
          "Não foi possível concluir a operação.";
        toastType.value = "error";
        showToast.value = true;
        console.error("Erro ao carregar /despesas:", err?.response || err);
      }
    };

    const resetFiltros = () => {
      filtros.value = { inicio: "", fim: "", categoria: "", prioridade: "" };
      q.value = "";
      loadList();
    };

    // busca local
    const filtered = computed(() => {
      const search = q.value.trim().toLowerCase();
      return list.value.filter((item) => {
        if (!search) return true;
        return (
          item.categoria?.toLowerCase().includes(search) ||
          item.subcategoria?.toLowerCase().includes(search) ||
          item.fornecedor?.toLowerCase().includes(search) ||
          item.descricao?.toLowerCase().includes(search) ||
          (item.numero_despesa || item.numero_nfe || "").toLowerCase().includes(search)
        );
      });
    });

    const clearErrors = () => {
      Object.keys(errors).forEach((k) => delete errors[k]);
    };

    const openCreate = () => {
      isEditing.value = false;
      showModal.value = true;
      clearErrors();
      Object.assign(form, {
        id: null,
        numero_despesa: "",
        data_despesa: "",
        prioridade: "",
        categoria: "",
        subcategoria: "",
        descricao: "",
        fornecedor: "",
        quantidade: 0,
        preco_unitario: 0,
        numero_nfe: "",
        data_vencimento: "",
        data_pagamento: "",
        observacoes: "",
      });
    };

    const openEdit = (item) => {
      isEditing.value = true;
      showModal.value = true;
      clearErrors();
      Object.assign(form, item);
    };

    const close = () => {
      showModal.value = false;
    };

    const openConfirmDelete = (item) => {
      if (!canDelete.value) {
        toastMessage.value = "Apenas gerente/administrador podem excluir despesas.";
        toastType.value = "warning";
        showToast.value = true;
        return;
      }
      confirmItem.value = item;
      showConfirm.value = true;
    };

    const cancelConfirm = () => {
      confirmItem.value = null;
      showConfirm.value = false;
    };

    const confirmDeleteConfirmed = async () => {
      try {
        await http.delete(`/despesa/${confirmItem.value.id}`);
        list.value = list.value.filter((i) => i.id !== confirmItem.value.id);
        toastMessage.value = "Despesa excluída com sucesso!";
        toastType.value = "success";
        showToast.value = true;
      } catch (err) {
        toastMessage.value =
          (err && (err.userMessage || err.message)) ||
          "Não foi possível concluir a operação.";
        toastType.value = "error";
        showToast.value = true;
        console.error("Erro ao excluir:", err?.response || err);
      } finally {
        cancelConfirm();
      }
    };

    const DATE_KEYS = [
  "data_despesa",
  "data_vencimento",
  "data_pagamento",
];

function normalizeDateOnly(obj) {
  DATE_KEYS.forEach((k) => {
    const v = obj[k];
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      obj[k] = v; // mantém como veio do <input type="date">
    }
  });
}

    // salvar
    const save = async () => {
      saving.value = true;
      try {
        // validação cliente
        clearErrors();

        if (!form.data_despesa) errors.data_despesa = "Data da despesa é obrigatória.";
        if (!form.fornecedor?.trim()) errors.fornecedor = "Informe o fornecedor.";

        const q = Number(form.quantidade || 0);
        const pu = Number(form.preco_unitario || 0);
        if (!(q > 0 && pu > 0)) {
          errors.preco = "Informe quantidade e preço unitário maiores que zero.";
        }

        if (Object.keys(errors).length) {
          toastMessage.value = "Por favor, corrija os campos destacados.";
          toastType.value = "warning";
          showToast.value = true;
          return; // não envia ao backend
        }

        // sanitização
        const payload = JSON.parse(JSON.stringify(form));
        for (const k of Object.keys(payload)) {
          if (typeof payload[k] === "string" && payload[k].trim() === "")
            payload[k] = null;
        }

        normalizeDateOnly(payload);
        delete payload.valor_total;

        let res;
        if (isEditing.value) {
          res = await http.put(`/despesa/${payload.id}`, payload);
          const updated = (res?.data?.despesa || res?.data) ?? payload;
          const idx = list.value.findIndex((i) => i.id === payload.id);
          if (idx > -1) list.value[idx] = updated;
        } else {
          res = await http.post("/despesa", payload);
          const created = (res?.data?.despesa || res?.data) ?? payload;
          list.value.push(created);
        }

        toastMessage.value = "Despesa salva com sucesso!";
        toastType.value = "success";
        showToast.value = true;
        close();
      } catch (err) {
        const details = err.fieldDetails || err?.response?.data?.details;
        if (details) {
          clearErrors();
          Object.assign(errors, details);
        }

        toastMessage.value =
          (err && (err.userMessage || err.message)) ||
          err?.response?.data?.message ||
          "Não foi possível concluir a operação.";
        toastType.value = "error";
        showToast.value = true;
      } finally {
        saving.value = false;
      }
    };

    // formatters
    const fmtNumero = (v) => {
      const n = Number(v || 0);
      return n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };
    const fmtData = (v) => (v ? formatDateBR(v) : "—");

    // mount
    onMounted(loadList);

    // expose
    return {
      errors,
      q,
      list,
      filtros,
      form,
      saving,

      CATEGORIAS,
      PRIORIDADES,

      showToast,
      toastMessage,
      toastType,
      showModal,
      isEditing,
      showConfirm,
      confirmItem,

      loadList,
      resetFiltros,
      openCreate,
      openEdit,
      close,
      confirmDeleteConfirmed,
      openConfirmDelete,
      cancelConfirm,
      save,

      fmtNumero,
      fmtData,

      canDelete,

      filtered,
    };
  },
};
</script>
