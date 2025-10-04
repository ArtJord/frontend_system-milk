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
          class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
          @click="loadList"
          title="Recarregar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582M20 20v-5h-.581M20 9A7.5 7.5 0 0 0 5.636 6.364M4 15a7.5 7.5 0 0 0 14.364 2.636"/>
          </svg>
          Atualizar
        </button>
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
        <input type="date" v-model="filtros.inicio"
               class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"/>
      </div>
      <div>
        <label class="text-sm text-gray-700">Até</label>
        <input type="date" v-model="filtros.fim"
               class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"/>
      </div>
      <div>
        <label class="text-sm text-gray-700">Categoria</label>
        <select v-model="filtros.categoria"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
          <option value="">Todas</option>
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label class="text-sm text-gray-700">Prioridade</label>
        <select v-model="filtros.prioridade"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
          <option value="">Todas</option>
          <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div class="flex items-end gap-2">
        <button @click="loadList" class="rounded-lg bg-gray-900 text-white px-4 py-2 hover:bg-black">Aplicar</button>
        <button @click="resetFiltros" class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">Limpar</button>
      </div>
    </div>

     <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="item in filtered" :key="item.id" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-gray-500">
              {{ fmtData(item.data_despesa) }} • {{ item.categoria || "—" }}<span v-if="item.subcategoria"> / {{ item.subcategoria }}</span>
            </div>
            <div class="mt-1 text-2xl font-semibold text-gray-900">
              R$ {{ fmtNumero(item.valor_total ?? (Number(item.quantidade||0) * Number(item.preco_unitario||0))) }}
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
              Venc.: {{ fmtData(item.data_vencimento) }} • Pag.: {{ fmtData(item.data_pagamento) }}
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(item)" class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Editar</button>
            <button v-if="canDelete" @click="openConfirmDelete(item)" class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Excluir</button>
          </div>
        </div>

        <div v-if="item.descricao" class="mt-3 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
          {{ item.descricao }}
        </div>
        <div v-if="item.observacoes" class="mt-2 text-xs text-gray-600">
          Observações: {{ item.observacoes }}
        </div>
      </div>
    </div>
        

</template>