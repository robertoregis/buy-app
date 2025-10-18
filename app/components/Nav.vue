<script lang="ts">
import { ref, defineComponent, watch } from 'vue';

export default defineComponent({
  name: 'Modal',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: false,
      default: '',
    },
    width: {
      type: String,
      required: false,
      default: '400px', // largura padrão do modal
    },
    closeOnBackdrop: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  emits: ['update:modelValue', 'closed'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);

    const closeModal = () => {
      isOpen.value = false;
      emit('update:modelValue', false);
      emit('closed');
    };

    // Acompanhar se o estado do modal for alterado fora
    watch(() => props.modelValue, (newVal) => {
      isOpen.value = newVal;
    });

    // Fechar se o usuário clicar fora do modal (em um fundo opaco)
    const handleBackdropClick = (e: MouseEvent) => {
      if (props.closeOnBackdrop && e.target === e.currentTarget) {
        closeModal();
      }
    };

    return {
      isOpen,
      closeModal,
      handleBackdropClick,
    };
  },
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex justify-center items-center"
    @click="handleBackdropClick"
  >
    <div
      style="width: 500px;"
      class="bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div v-if="title" class="text-xl font-semibold mb-4">{{ title }}</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols-1 gap-2">
            <template v-for="value in [1, 2]" :key="value">
                <div class="col-span-1 bg-white p-2">
                            <div class="flex flex-col">
                                <h2 class="text-sm font-[600]">Últimas compras</h2>
                                <div class="flex flex-col">
                                    <span>testando</span>
                                </div>
                            </div>
                        </div>
            </template>
        </div>
      </div>

      <!-- Botão de Fechar -->
      <button
        class="cursor-pointer absolute top-[10px] right-[10px] text-gray-600 hover:text-gray-900"
        @click="closeModal"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Animação suave */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

div[v-cloak] {
  display: none;
}

div.fixed {
  animation: fadeIn 0.3s ease-in-out;
}
</style>

