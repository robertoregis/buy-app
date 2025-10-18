<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { vMaska } from "maska/vue";

export default defineComponent({
  name: 'NewModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    closeOnBackdrop: {
      type: Boolean,
      required: false,
      default: true,
    },
    newId: {
      type: String,
      required: true
    }
  },
  directives: {
		maska: vMaska, // 👈 registra a diretiva
	},
  emits: ['update:modelValue', 'closed'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const router = useRouter();
    const newId = ref(props.newId);
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
      goRouter,
    };
  },
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed px-2 inset-0 bg-black/50 bg-opacity-50 z-50 flex justify-center items-center"
    @click="handleBackdropClick"
  >
    <div
      class="w-[800px] bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div class="text-xl font-semibold mb-2">título da novidade</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols py-4">
          <div class="col-span-1">
            <div class="grid grid-cols-1">
              <div class="col-span-1">
                <div class="flex flex-col">
                  <div class="flex items-center">
                    <span class="text-[0.9rem]">Data de criação:</span>
                    <span class="text-sm ml-2">12/05/2025</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-[0.9rem]">Data de entrega:</span>
                    <span class="text-sm ml-2">12/05/2025</span>
                  </div>
                  <div class="flex mt-2">
                    <span class="bg-red-600 text-white text-[0.8rem]" style="padding: 1px 10px;">Importância</span>
                  </div>
                </div>
              </div>

              <div class="col-span-1 mt-4">
                <div class="flex flex-col">
                  <div class="flex flex-col">
                    <h2 class="font-[600]">Descrição</h2>
                    <p>kdkddkdkd</p>
                  </div>
                  <div class="flex flex-col mt-2">
                    <h2 class="font-[600]">Impacto para o cliente</h2>
                    <p>kdkddkdkd</p>
                  </div>
                  <div class="flex flex-col mt-2">
                    <h2 class="font-[600]">Observações</h2>
                    <p>kdkddkdkd</p>
                  </div>
                </div>
              </div>
            </div>
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