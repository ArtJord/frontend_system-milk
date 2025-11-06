<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  type: { type: String, default: "success" }, // success | error | info
  title: { type: String, default: "" },
  text:  { type: String, default: "" },
  okText:{ type: String, default: "OK" },
});
const emit = defineEmits(["ok","close"]);
function onOk(){ emit("ok"); }
function onBackdrop(e){ if (e.target === e.currentTarget) emit("close"); }
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
    @click="onBackdrop"
  >
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
      <div class="flex items-start gap-3">
        <div
          :class="{
            'bg-emerald-100 text-emerald-700': type==='success',
            'bg-red-100 text-red-700': type==='error',
            'bg-sky-100 text-sky-700': type==='info'
          }"
          class="h-10 w-10 rounded-xl grid place-items-center"
        >
          <svg v-if="type==='success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <svg v-else-if="type==='error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
          <p class="text-slate-600 mt-1">{{ text }}</p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          class="inline-flex items-center rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
          @click="onOk"
        >
          {{ okText }}
        </button>
      </div>
    </div>
  </div>
</template>
