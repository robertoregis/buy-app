<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { vMaska } from "maska/vue";

export default defineComponent({
  name: 'Participant',
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
      required: false
    },
    participant: {
      type: Object,
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
    const participant = ref(props.participant)

    const closeModal = () => {
      isOpen.value = false;
      emit('update:modelValue', false);
      emit('closed');
    };

    // Acompanhar se o estado do modal for alterado fora
    watch(() => props.modelValue, (newVal) => {
      isOpen.value = newVal;
    });

    watch(() => props.participant, (newVal) => {
      participant.value = newVal;
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
      participant,
    };
  },
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
    @click="handleBackdropClick"
  >
    <div
      class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100"
    >
      <!-- Cabeçalho do modal -->
      <div class="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Perfil do Participante</h2>
            <p class="text-cyan-100 text-sm mt-1">Informações detalhadas</p>
          </div>
          <button
            class="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
            @click="closeModal"
          >
            <Icon name="mdi:close" class="text-lg text-white" />
          </button>
        </div>
      </div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1 px-6 py-6">
        <div class="flex flex-col items-center text-center mb-6">
          <!-- Avatar -->
          <div class="relative mb-4">
            <img 
              :src="participant.image_url || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User'" 
              :alt="participant.name"
              class="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
            >
            <div class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <h3 class="text-2xl font-bold text-gray-800 mb-1">{{ participant.name }}</h3>
          <p class="text-gray-500">Membro do grupo</p>
        </div>

        <!-- Informações -->
        <div class="space-y-6">
          <!-- Informações Pessoais -->
          <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Icon name="mdi:account-circle" class="text-teal-600 mr-2 text-xl" />
              Informações Pessoais
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <span class="text-gray-600 font-medium">Nome completo</span>
                <span class="text-gray-800 font-semibold">{{ participant.name || 'Não informado' }}</span>
              </div>
              
              <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <span class="text-gray-600 font-medium">E-mail</span>
                <span class="text-gray-800 font-semibold">{{ participant.email || 'Não informado' }}</span>
              </div>
              
              <div class="flex items-center justify-between py-2">
                <span class="text-gray-600 font-medium">Status</span>
                <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Ativo
                </span>
              </div>
            </div>
          </div>

          <!-- Estatísticas (pode adicionar mais dados depois) -->
          <!--<div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <div class="text-2xl font-bold text-blue-600 mb-1">0</div>
              <div class="text-sm text-blue-800 font-medium">Compras</div>
            </div>
            
            <div class="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
              <div class="text-2xl font-bold text-purple-600 mb-1">0</div>
              <div class="text-sm text-purple-800 font-medium">Grupos</div>
            </div>
          </div>-->

        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div class="flex items-center justify-end">
          <button
            @click="closeModal"
            class="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
          >
            <Icon name="mdi:check" class="text-lg" />
            <span>Fechar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animações */
@keyframes fadeIn {
  0% { 
    opacity: 0; 
    transform: scale(0.95);
  }
  100% { 
    opacity: 1; 
    transform: scale(1);
  }
}

@keyframes slideIn {
  0% { 
    opacity: 0; 
    transform: translateY(-20px);
  }
  100% { 
    opacity: 1; 
    transform: translateY(0);
  }
}

.fixed {
  animation: fadeIn 0.3s ease-out;
}

.fixed > div {
  animation: slideIn 0.3s ease-out;
}

/* Scrollbar customizada */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>