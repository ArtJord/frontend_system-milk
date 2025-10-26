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
          placeholder="Buscar por cliente, fonte ou categoria"
          class="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        @click="openCreate"
      >
        Novo registro de lucro
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
              {{ fmtData(item.data_receita) }} • {{ item.categoria || "—" }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-gray-900">
              R$ {{ fmtNumero(item.valor_total) }}
            </div>
            <div class="mt-1 text-sm text-gray-700">
              Cliente: <span class="font-medium">{{ item.cliente || "—" }}</span>
            </div>
            <div class="mt-1 text-xs text-gray-600">
              Fonte: {{ item.fonte_receita || "—" }} • NF-e: {{ item.numero_nfe || "—" }}
            </div>
            <div class="mt-1 text-xs text-gray-600">
              Pagamento: {{ item.metodo_pagamento || "—" }} • Status:
              {{ item.status_pagamento || "—" }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Editar (lápis) -->
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

            <!-- Excluir (lixeira) -->
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

    <!-- Modal de confirmação -->
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
                Tem certeza que deseja excluir este registro de lucro?
              </p>
              <div
                v-if="confirmItem"
                class="mt-4 rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700"
              >
                <div><strong>Data:</strong> {{ fmtData(confirmItem.data_receita) }}</div>
                <div class="mt-1">
                  <strong>Valor:</strong> R$ {{ fmtNumero(confirmItem.valor_total) }}
                </div>
                <div class="mt-1">
                  <strong>Cliente:</strong> {{ confirmItem.cliente || "—" }}
                </div>
              </div>
            </div>
            <button
              @click="cancelConfirm"
              class="ml-3 rounded-md p-2 text-gray-400 hover:bg-gray-50"
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

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div class="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? "Editar registro de lucro" : "Novo registro de lucro" }}
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

        <div class="max-h-[75vh] overflow-y-auto px-5 py-4 space-y-6">
          <!-- Dados principais -->
          <!-- Dados principais -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Dados principais</h4>

            <!-- WRAPPER correto (grid) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Data da receita (*) -->
              <div>
                <label class="text-sm text-gray-700">
                  Data da receita <span class="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  v-model="form.data_receita"
                  required
                  aria-required="true"
                  :aria-invalid="!!errors.data_receita"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.data_receita,
                    'border-gray-300': !errors.data_receita,
                  }"
                />
                <p v-if="errors.data_receita" class="mt-1 text-xs text-red-600">
                  {{ errors.data_receita }}
                </p>
              </div>

              <!-- Categoria (opcional) -->
              <div>
                <label class="text-sm text-gray-700">Categoria</label>
                <select
                  v-model="form.categoria"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option>Venda de leite</option>
                  <option>Venda de animais</option>
                  <option>Venda de derivados</option>
                  <option>Prestação de serviço</option>
                  <option>Subsídios</option>
                  <option>Outros</option>
                </select>
              </div>

              <!-- Cliente OU Fonte (um dos dois é obrigatório) -->
              <div>
                <label class="text-sm text-gray-700">
                  Cliente <span class="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  v-model="form.cliente"
                  :aria-invalid="!!errors.identificacao"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.identificacao,
                    'border-gray-300': !errors.identificacao,
                  }"
                  placeholder="Ex.: Laticínio AC"
                />
              </div>

              <div>
                <label class="text-sm text-gray-700">
                  Fonte da receita <span class="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  v-model="form.fonte_receita"
                  :aria-invalid="!!errors.identificacao"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.identificacao,
                    'border-gray-300': !errors.identificacao,
                  }"
                  placeholder="Ex.: Contrato 123 / Parceria X"
                />
              </div>

              <!-- Mensagem combinada (uma só, após os dois campos) -->
              <p
                v-if="errors.identificacao"
                class="mt-1 text-xs text-red-600 md:col-span-2"
              >
                {{ errors.identificacao }}
              </p>
            </div>
          </section>

          <!-- Valores -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Valores</h4>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Quantidade -->
              <div>
                <label class="text-sm text-gray-700">Quantidade</label>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="form.quantidade"
                  :aria-invalid="!!errors.valor"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.valor,
                    'border-gray-300': !errors.valor,
                  }"
                  placeholder="Ex.: 2"
                />
              </div>

              <!-- Preço unitário -->
              <div>
                <label class="text-sm text-gray-700">Preço unitário</label>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="form.preco_unitario"
                  :aria-invalid="!!errors.valor"
                  class="mt-1 w-full rounded-md border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  :class="{
                    'border-red-500': !!errors.valor,
                    'border-gray-300': !errors.valor,
                  }"
                  placeholder="Ex.: 50"
                />
              </div>

              <!-- Valor total (readonly) -->
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

            <!-- Mensagem de erro dos valores -->
            <p v-if="errors.valor" class="mt-1 text-xs text-red-600">
              {{ errors.valor }}
            </p>
          </section>

          <!-- Pagamento -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Pagamento</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-sm text-gray-700">Método de pagamento</label>
                <select
                  v-model="form.metodo_pagamento"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option>Dinheiro</option>
                  <option>Pix</option>
                  <option>Transferência bancária</option>
                  <option>Boleto</option>
                  <option>Cartão de débito</option>
                  <option>Cartão de crédito</option>
                  <option>Cheque</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Status do pagamento</label>
                <select
                  v-model="form.status_pagamento"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Selecione</option>
                  <option>Recebido</option>
                  <option>Pendente</option>
                  <option>Atrasado</option>
                  <option>Cancelado</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Número NF-e</label>
                <input
                  type="text"
                  v-model="form.numero_nfe"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
          </section>

          <!-- Observações e descrição -->
          <section class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800">Descrição e observações</h4>
            <textarea
              v-model="form.descricao"
              rows="3"
              placeholder="Descrição detalhada"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            ></textarea>
            <textarea
              v-model="form.observacoes"
              rows="2"
              placeholder="Observações adicionais"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
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
import { useRoute } from "vue-router"; //testar dps
import http from "@/lib/http";

export default {
  name: "LucroView",
  setup() {
    const saving = ref(false);
    const q = ref("");
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastType = ref("success");
    const showModal = ref(false);
    const isEditing = ref(false);
    const showConfirm = ref(false);
    const confirmItem = ref(null);

    watch(showToast, (val) => {
      if (val) {
        setTimeout(() => (showToast.value = false), 3000);
      }
    });

    const form = reactive({
      id: null,
      data_receita: "",
      categoria: "",
      cliente: "",
      fonte_receita: "",
      descricao: "",
      quantidade: 0,
      preco_unitario: 0,
      valor_total: 0,
      numero_nfe: "",
      metodo_pagamento: "",
      status_pagamento: "",
      data_vencimento: "",
      data_pagamento: "",
      observacoes: "",
    });

    const manualValorTotal = ref(false);

    // Recalcula valor_total se usuário não editou manualmente
    watch([() => form.quantidade, () => form.preco_unitario], () => {
      if (!manualValorTotal.value) {
        form.valor_total =
          Number(form.quantidade || 0) * Number(form.preco_unitario || 0);
      }
    });
    function onValorTotalInput() {
      manualValorTotal.value = true;
    }
    const errors = ref({});
    const clearErrors = () => {
      errors.value = {};
    };

    const filtros = ref({
      inicio: "",
      fim: "",
      categoria: "",
    });

    const CATEGORIAS = [
      "Venda de leite",
      "Venda de animais",
      "Venda de derivados",
      "Prestação de serviço",
      "Subsídios",
      "Outros",
    ];

    const list = ref([]);
    const route = useRoute();

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

   const openConfirmDelete = (item) => {
  if (!canDelete.value) {
    toastMessage.value = "Apenas gerente/administrador podem excluir.";
    toastType.value = "warning";
    showToast.value = true;
    return;
  }
  confirmItem.value = item;
  showConfirm.value = true;
};

    const loadList = async () => {
      try {
        const res = await http.get("/lucros", {
          params: {
            inicio: filtros.value.inicio || undefined,
            fim: filtros.value.fim || undefined,
            categoria: filtros.value.categoria || undefined,
          },
        });

        // aceita vários formatos de retorno
        const payload =
          res?.data?.lucros ??
          res?.data?.lucro ??
          (Array.isArray(res?.data) ? res.data : []);

        let base = Array.isArray(payload) ? payload : [];
        // fallback
        base = applyLocalFilters(base, filtros.value);

        list.value = base;
      } catch (err) {
        list.value = [];
        toastMessage.value =
          err?.response?.data?.message ||
          "Erro ao carregar os registros (veja o console).";
        toastType.value = "error";
        showToast.value = true;
        console.error("GET /lucros falhou:", err?.response || err);
      }
    };

    function applyLocalFilters(items, f) {
      const ini = (f.inicio || "").slice(0, 10);
      const fim = (f.fim || "").slice(0, 10);
      const cat = (f.categoria || "").toLowerCase();

      return items.filter((it) => {
        const d = (it.data_receita || "").slice(0, 10);
        const c = (it.categoria || "").toLowerCase();

        if (ini && d < ini) return false;
        if (fim && d > fim) return false;

        if (cat && c !== cat) return false;

        return true;
      });
    }

    const resetFiltros = () => {
      filtros.value.inicio = "";
      filtros.value.fim = "";
      filtros.value.categoria = "";
      q.value = "";
      loadList();
    };

    const filtered = computed(() => {
      return list.value.filter((item) => {
        const search = q.value.toLowerCase();
        return (
          !search ||
          item.categoria?.toLowerCase().includes(search) ||
          item.cliente?.toLowerCase().includes(search) ||
          item.fonte_receita?.toLowerCase().includes(search)
        );
      });
    });

    const openCreate = () => {
      isEditing.value = false;
      showModal.value = true;
      Object.assign(form, {
        id: null,
        data_receita: "",
        categoria: "",
        cliente: "",
        fonte_receita: "",
        descricao: "",
        quantidade: 0,
        preco_unitario: 0,
        valor_total: 0,
        numero_nfe: "",
        metodo_pagamento: "",
        status_pagamento: "",
        data_vencimento: "",
        data_pagamento: "",
        observacoes: "",
      });
      clearErrors();
    };

    const openEdit = (item) => {
      isEditing.value = true;
      showModal.value = true;
      Object.assign(form, item); // atualiza reactive corretamente
      clearErrors();
    };

    const close = () => {
      showModal.value = false;
    };

    const cancelConfirm = () => {
      confirmItem.value = null;
      showConfirm.value = false;
    };

    const confirmDeleteConfirmed = async () => {
  try {
    await http.delete(`/lucro/${confirmItem.value.id}`);
    list.value = list.value.filter((i) => i.id !== confirmItem.value.id);
    toastMessage.value = "Registro excluído com sucesso!";
    toastType.value = "success";
  } catch (err) {
    const status = err?.response?.status;
    toastMessage.value =
      status === 403
        ? "Permissão negada. Somente gerente/administrador podem excluir."
        : err?.response?.data?.message ||
          err?.userMessage ||
          err?.message ||
          "Não foi possível concluir a operação.";
    toastType.value = "error";
  } finally {
    showToast.value = true;
    setTimeout(() => (showToast.value = false), 3000);
    cancelConfirm();
  }
};

    const save = async () => {
      saving.value = true;
      clearErrors();

      try {
        if (!form.data_receita) {
          errors.value.data_receita = "Data da receita é obrigatória.";
        }

        const temIdent =
          (form.cliente && form.cliente.trim()) ||
          (form.fonte_receita && form.fonte_receita.trim());
        if (!temIdent) {
          errors.value.identificacao = "Preencha Cliente ou Fonte da receita.";
        }

        const q = Number(form.quantidade || 0);
        const pu = Number(form.preco_unitario || 0);
        const vt = Number(form.valor_total || 0);
        const total = vt > 0 ? vt : q * pu;
        if (!(total > 0)) {
          errors.value.valor =
            "Informe valor total ou preencha quantidade e preço unitário maiores que zero.";
        }

        if (Object.keys(errors.value).length) {
          toastMessage.value = "Por favor, corrija os campos destacados.";
          toastType.value = "warning";
          showToast.value = true;
          return;
        }

        const payload = JSON.parse(JSON.stringify(form));
        for (const k of Object.keys(payload)) {
          if (typeof payload[k] === "string" && payload[k].trim() === "") {
            payload[k] = null;
          }
        }

        delete payload.valor_total;

        let res;
        if (isEditing.value) {
          res = await http.put(`/lucro/${payload.id}`, payload);
          const updated = (res?.data?.lucro || res?.data) ?? payload;
          const idx = list.value.findIndex((i) => i.id === payload.id);
          if (idx > -1) list.value[idx] = updated;
        } else {
          res = await http.post("/lucro", payload);
          const created = (res?.data?.lucro || res?.data) ?? payload;
          list.value.push(created);
        }

        toastMessage.value = "Registro salvo com sucesso!";
        toastType.value = "success";
        showToast.value = true;
        close();
      } catch (err) {
        const details = err?.response?.data?.details;
        if (details && typeof details === "object") {
          clearErrors();
          errors.value = details;
        }

        toastMessage.value =
          err?.response?.data?.message ||
          err?.userMessage ||
          err?.message ||
          "Não foi possível concluir a operação.";
        toastType.value = "error";
        showToast.value = true;
      } finally {
        saving.value = false;
      }
    };

    const fmtNumero = (v) => {
      if (!v) return "0,00";
      return Number(v).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const fmtData = (v) => {
      if (!v) return "—";
      return new Date(v).toLocaleDateString("pt-BR");
    };

    onMounted(() => {
      loadList();
    });

    return {
      form,
      onValorTotalInput,
      q,
      filtros,
      list,
      filtered,
      showModal,
      isEditing,
      errors,
      showToast,
      toastMessage,
      toastType,
      openCreate,
      openEdit,
      close,
      save,
      fmtNumero,
      fmtData,
      showConfirm,
      confirmItem,
      openConfirmDelete,
      cancelConfirm,
      confirmDeleteConfirmed,
      resetFiltros,
      canDelete,
      saving,
      CATEGORIAS,
      loadList,
    };
  },
};
</script>
