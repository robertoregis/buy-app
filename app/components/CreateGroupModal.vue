<script lang="ts">
  import { ref, defineComponent, watch } from 'vue';
  import { createGroup, createParticipantInGroup } from '../composables/firebaseDocs';
  import { useAuthentication } from '../stores/authentication';

  export default defineComponent({
    name: 'CreateGroupModal',
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
    emits: ['update:modelValue', 'closed', 'create'],
    setup(props, { emit }) {
      const authentication: any = useAuthentication();
      const isOpen = ref(props.modelValue);
      const newId = ref(props.newId);
      const router = useRouter();
      const { notify } = useNotification();
      const formdata = ref<any>({
        name: null,
        description: null,
      })
      const closeModal = () => {
        isOpen.value = false;
        emit('update:modelValue', false);
        emit('closed');
      };

      // Acompanhar se o estado do modal for alterado fora
      watch(() => props.modelValue, (newVal) => {
        isOpen.value = newVal;
      });

      const send = async () => {
        if(!formdata.value.name) {
          notify({
            text: 'Escreva o nome',
            type: 'error'
          })
          return
        }
        if(!formdata.value.description) {
          notify({
            text: 'Escreva o descrição',
            type: 'error'
          })
          return
        }
        try {
          await createGroup({
            name: formdata.value.name,
            description: formdata.value.description,
            owner_id: authentication.userId,
            members: [authentication.userId]
          }).then(async (groupId: string) => {
            await createParticipantInGroup(groupId, {
              id: authentication.userId,
              name: authentication.user.name,
              email: authentication.user.email
            })
            closeModal();
            emit('create');
          })
        } catch(error) {
          console.log(error)
        }
      }

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
        formdata,
        newId,
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
      <div class="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">{{ newId ? 'Editar' : 'Criar' }} Grupo</h2>
            <p class="text-blue-100 text-sm mt-1">Organize suas compras em grupo</p>
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
        <!-- Instruções -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
            <Icon name="mdi:account-group" class="text-indigo-600 text-xl" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Criar Novo Grupo</h3>
          <p class="text-gray-500 text-sm">
            Preencha os dados para criar um novo grupo de compras
          </p>
        </div>

        <form class="space-y-6">
          <!-- Nome do Grupo -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Nome do Grupo
              <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="formdata.name"
                type="text" 
                placeholder="Ex: Família, Amigos do Trabalho, Casa..."
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white placeholder-gray-400"
              >
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Icon name="mdi:tag" class="text-gray-400 text-lg" />
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
              placeholder="Descreva o propósito deste grupo..."
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white placeholder-gray-400 resize-none"
            />
          </div>

          <!-- Informações do Criador -->
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="mdi:account" class="text-green-600 text-lg" />
              </div>
              <div>
                <p class="text-gray-600 font-medium">Criador do Grupo</p>
                <p class="text-gray-800 font-semibold">{{ authentication.user.name }}</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer com Botões -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div class="flex items-center justify-end space-x-4">
          <button
            @click="closeModal"
            class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            @click.prevent="send"
            class="px-8 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center space-x-2"
          >
            <Icon name="mdi:account-plus" class="text-lg" />
            <span>{{ newId ? 'Atualizar' : 'Criar' }} Grupo</span>
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
textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
</style>