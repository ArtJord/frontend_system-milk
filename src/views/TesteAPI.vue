<!-- src/views/TesteAPI.vue -->
<script setup>
import { ref } from 'vue'
import http from '@/lib/http'

const resposta = ref('')
const erro = ref('')

async function chamarAPI () {
  resposta.value = ''
  erro.value = ''
  try {
    const r = await http.get('/status.php', { timeout: 8000 })
    resposta.value = JSON.stringify(r.data, null, 2)
  } catch (e) {
    console.error(e)
    // mostra mensagem amigável ou payload de erro do servidor
    erro.value = e?.response?.data
      ? JSON.stringify(e.response.data)
      : e.message || 'Falha na requisição'
  }
}
</script>

<template>
  <div style="padding: 24px; max-width: 720px">
    <h1>Teste de conexão com o Back</h1>
    <button @click="chamarAPI">Chamar API</button>

    <pre v-if="resposta" style="white-space: pre-wrap; margin-top: 16px;">
{{ resposta }}
    </pre>

    <p v-if="erro" style="color: #c00; margin-top: 16px;">
      ❌ Erro: {{ erro }}
    </p>
  </div>
</template>

<style scoped></style>
