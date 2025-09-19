<template>
  <div class="h-screen w-screen bg-gray-50 text-gray-900">
    <!-- Sidebar fixo (sem border-r) -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-white">
      <div class="h-16 flex items-center px-4">
        <span class="inline-flex items-center gap-2 text-gray-900 font-semibold">
          <!-- Ícone real (Milk) no lugar do círculo -->
          <Milk class="h-6 w-6 text-green-600" />
          System Milk
        </span>
      </div>

      <nav class="p-2 space-y-1">
        <RouterLink to="/dashboard" class="block rounded-md px-3 py-2 hover:bg-gray-100" active-class="bg-gray-100 font-medium">
          Dashboard
        </RouterLink>
        <RouterLink to="/animais" class="block rounded-md px-3 py-2 hover:bg-gray-100" active-class="bg-gray-100 font-medium">
          Animais
        </RouterLink>
        <RouterLink to="/leite" class="block rounded-md px-3 py-2 hover:bg-gray-100" active-class="bg-gray-100 font-medium">
          Leite
        </RouterLink>
        <RouterLink to="/lucros" class="block rounded-md px-3 py-2 hover:bg-gray-100" active-class="bg-gray-100 font-medium">
          Lucros
        </RouterLink>
        <RouterLink to="/despesas" class="block rounded-md px-3 py-2 hover:bg-gray-100" active-class="bg-gray-100 font-medium">
          Despesas
        </RouterLink>
        <RouterLink to="/relatorios" class="block rounded-md px-3 py-2 hover:bg-gray-100" active-class="bg-gray-100 font-medium">
          Relatórios
        </RouterLink>

        <button @click="logout" class="mt-4 w-full text-left text-red-600 rounded-md px-3 py-2 hover:bg-red-50">
          Sair
        </button>
      </nav>
    </aside>

    <!-- Conteúdo: sem border-b no header -->
    <div class="ml-64 h-screen flex flex-col">
      <header class="h-16 sticky top-0 bg-white flex items-center justify-between px-6">
        <h1 class="font-semibold">{{ pageTitle }}</h1>
        <div class="flex items-center gap-3"><!-- ações/topbar --></div>
      </header>

      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Milk } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title ?? 'System Milk')

function logout () {
  localStorage.removeItem('auth_token')
  router.push('/login')
}
</script>
