<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { vMaska } from "maska/vue";

export default defineComponent({
  name: 'Modal',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    closeOnBackdrop: {
      type: Boolean,
      required: false,
      default: true,
    }
  },
  directives: {
		maska: vMaska, // 👈 registra a diretiva
	},
  emits: ['update:modelValue', 'closed'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const router = useRouter();
    const closeModal = () => {
      isOpen.value = false;
      emit('update:modelValue', false);
      emit('closed');
    };

    // Acompanhar se o estado do modal for alterado fora
    watch(() => props.modelValue, (newVal) => {
      isOpen.value = newVal;
    });

    const goRouter = () => {
      router.push(`/tarefas`)
    }

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
      goRouter
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
      class="w-[600px] bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div class="text-xl font-semibold mb-4">título do card</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols p-10">
          <div class="col-span-1">
          </div>
        </div>
      </div>

      <!-- Botão de Fechar -->
      <button
        class="cursor-pointer absolute top-[10px] right-[10px] text-gray-600 hover:text-gray-900"
        @click="closeModal"
      >
			<Icon name="mdi:close" class="text-xl" />
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