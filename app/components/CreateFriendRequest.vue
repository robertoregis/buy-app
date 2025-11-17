<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { createFriendRequest } from '../composables/firebaseDocs';
import { useAuthentication } from '../stores/authentication';

export default defineComponent({
  name: 'CreateFriendRequest',
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
    users: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'closed', 'created'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const users = ref(props.users);
    const router = useRouter();
    const authentication: any = useAuthentication()
    const versions = ref<any[]>([
      'Mensal', 'Quinzenal', 'Semanal', 'Avulsa'
    ])
    const { notify } = useNotification();
    const closeModal = () => {
      isOpen.value = false;
      emit('update:modelValue', false);
      emit('closed');
    };

    // Acompanhar se o estado do modal for alterado fora
    watch(() => props.modelValue, (newVal) => {
      isOpen.value = newVal;
    });
    watch(() => props.users, (newVal) => {
      users.value = newVal;
    });

    const create = async () => {
      try {
        await createFriendRequest(users.value.me, users.value.they).
          then((response: any) => {
            if(response.status === 200) {
              notify({
                text: response.message,
                type: 'success'
              })
              router.push(`/conta/amigos/pedidos`)
            } else if(response.status === 300 || response.status === 301) {
              notify({
                text: response.message,
                type: 'error'
              })
            }
            closeModal();
          })
        // você pode escolher para onde redirecionar (ex: para a planejada)
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
      users,
      versions,
      create,
      authentication
    };
  },
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex justify-center items-center p-4"
    @click="handleBackdropClick"
  >
    <div
      class="w-full max-w-md bg-white rounded-2xl shadow-xl relative overflow-hidden border border-gray-200"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-pink-700 p-6 text-center">
        <h1 class="text-xl font-bold text-white mb-1">Solicitar Amizade</h1>
        <p class="text-purple-100 text-sm">Convide alguém para sua rede</p>
      </div>

      <!-- Conteúdo -->
      <div class="p-6">
        <div class="text-center mb-6">
          <div class="w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="mdi:account" class="text-2xl text-white" />
          </div>
          <p class="text-gray-700">
            Você está prestes a enviar uma solicitação de amizade para
            <span class="font-semibold text-purple-700">{{ users.they.name }}</span>
          </p>
        </div>

        <!-- Informações adicionais -->
        <div class="bg-purple-50 rounded-lg p-4 mb-6">
          <div class="flex items-center text-sm text-purple-800">
            <Icon name="mdi:information" class="text-lg mr-2" />
            <span>Esta pessoa poderá ver seu perfil e atividades</span>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex space-x-3">
          <button
            @click="closeModal"
            class="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-1 px-2 md:py-3 md:px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95"
          >
            <Icon name="mdi:close" class="text-lg" />
            <span class="text-sm lg:text-base">Cancelar</span>
          </button>
          
          <button
            @click="create"
            class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-1 px-2 md:py-3 md:px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95"
          >
            <Icon name="mdi:send" class="text-lg" />
            <span class="text-sm lg:text-base">Enviar Pedido</span>
          </button>
        </div>
      </div>

      <!-- Botão Fechar -->
      <button
        class="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        @click="closeModal"
      >
        <Icon name="mdi:close" class="text-xl" />
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

div.fixed {
  animation: fadeIn 0.3s ease-in-out;
}

/* Efeito de hover suave nos botões */
button {
  transition: all 0.2s ease-in-out;
}
</style>