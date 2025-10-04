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
        

</template>