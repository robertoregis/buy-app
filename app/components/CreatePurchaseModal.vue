<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { vMaska } from "maska/vue";
import { createPurchase } from '../composables/firebaseDocs';
import { useAuthentication } from '../stores/authentication';

export default defineComponent({
  name: 'CreatePurchaseModal',
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
    }
  },
  directives: {
		maska: vMaska, // 👈 registra a diretiva
	},
  emits: ['update:modelValue', 'closed', 'created'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const newId = ref(props.newId);
    const router = useRouter();
    const { notify } = useNotification();
    const formdata = ref<any>({
      title: null,
      description: null,
      date: null,
      version: null
    })
    const authentication: any = useAuthentication()
    const versions = ref<any[]>([
      'Mensal', 'Quinzenal', 'Semanal', 'Avulsa'
    ])
    const closeModal = () => {
      isOpen.value = false;
      emit('update:modelValue', false);
      emit('closed');
    };

    function generateCode(length = 8) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    // Acompanhar se o estado do modal for alterado fora
    watch(() => props.modelValue, (newVal) => {
      isOpen.value = newVal;
    });

    const showNotify = (text: string, type: string) => {
      notify({
        text: text,
        type: type
      })
    }

    const send = async () => {
      if (!formdata.value.title) return showNotify('Escreva o nome', 'error');
      if (!formdata.value.description) return showNotify('Escreva a descrição', 'error');
      if (!formdata.value.version) return showNotify('Escolha a versão', 'error');
      if (!formdata.value.date) return showNotify('Escreva a data', 'error');

      try {
        const code = generateCode(13);
        const baseData = {
          name: formdata.value.title,
          description: formdata.value.description,
          planned_date: formdata.value.date,
          version: formdata.value.version,
          code,
        };

        const result = await createPurchase(authentication.group.id, authentication.userId, {
          ...baseData,
        })

        // você pode escolher para onde redirecionar (ex: para a planejada)
        router.push(`/conta/compras/${result}/exibir`);
        closeModal();
      } catch (error) {
        console.error(error);
      }
    };


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
      formdata,
      newId,
      versions,
      send,
      authentication
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
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">{{ newId ? 'Editar' : 'Criar' }} Compra</h2>
            <p class="text-blue-100 text-sm mt-1">Preencha os dados da nova compra</p>
          </div>
          <button
            class="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
            @click="closeModal"
          >
            <Icon name="mdi:close" class="text-lg text-white" />
          </button>
        </div>
      </div>

      <!-- Informações do Grupo -->
      <div class="px-6 pt-6">
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="mdi:account-group" class="text-blue-600 text-lg" />
              </div>
              <div>
                <p class="text-gray-600 font-medium">Grupo</p>
                <p class="text-gray-800 font-semibold">{{ authentication.group.name }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="mdi:account-multiple" class="text-green-600 text-lg" />
              </div>
              <div>
                <p class="text-gray-600 font-medium">Participantes</p>
                <p class="text-gray-800 font-semibold">{{ authentication.group.members.length }} membros</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1 px-6 py-6">
        <form class="space-y-6">
          <!-- Título -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Título da Compra
              <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="formdata.title"
                type="text" 
                placeholder="Ex: Compra do Mês - Setembro"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
              >
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Icon name="mdi:format-title" class="text-gray-400 text-lg" />
              </div>
            </div>
          </div>

          <!-- Descrição -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Descrição
              <span class="text-red-500 ml-1">*</span>
            </label>
            <textarea 
              v-model="formdata.description"
              rows="4" 
              placeholder="Descreva os objetivos desta compra..."
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400 resize-none"
            />
          </div>

          <!-- Versão e Data -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Versão -->
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">
                Periodicidade
                <span class="text-red-500 ml-1">*</span>
              </label>
              <div class="relative">
                <select
                  v-model="formdata.version"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none"
                >
                  <option disabled :value="null">Selecione a versão</option>
                  <option v-for="(version, index) in versions" :key="version" :value="version">
                    {{ version }}
                  </option>
                </select>
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Icon name="mdi:chevron-down" class="text-gray-400 text-lg" />
                </div>
              </div>
            </div>

            <!-- Data -->
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">
                Data Planejada
                <span class="text-red-500 ml-1">*</span>
              </label>
              <div class="relative">
                <input 
                  v-model="formdata.date"
                  v-maska
                  data-maska="##/##/####"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
                >
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Icon name="mdi:calendar" class="text-gray-400 text-lg" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer com Botão -->
      <div class="border-t border-gray-200 px-3 py-2 lg:px-6 lg:py-4 bg-gray-50">
        <div class="flex items-center justify-between lg:justify-end space-x-4">
          <button
            @click="closeModal"
            class="px-4 py-1.5 lg:px-8 lg:py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            <span class="text-sm lg:text-base">Cancelar</span>
          </button>
          <button
            @click.prevent="send"
            class="px-4 py-1.5 lg:px-8 lg:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center space-x-2"
          >
            <Icon name="mdi:check" class="text-base lg:text-lg" />
            <span class="text-sm lg:text-base">{{ newId ? 'Atualizar' : 'Criar' }} Compra</span>
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

/* Placeholder styling */
input::placeholder,
textarea::placeholder {
  color: #9CA3AF;
  opacity: 1;
}

/* Focus states */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>