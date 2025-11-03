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
            } else if(response.status === 300) {
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
    class="fixed px-2 inset-0 bg-black/50 bg-opacity-50 z-100 flex justify-center items-center"
    @click="handleBackdropClick"
  >
    <div
      class="w-[600px] bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div class="text-xl font-semibold mb-2">Criar pedido de amizade</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols py-4">
          <div class="col-span-1">
            <div class="grid grid-cols-1">
              <div class="col-span-1">
                <p>Você está perto de criar um pedido de amizade para <span class="font-[600]">{{ users.they.name }}.</span></p>
              </div>
              <div class="col-span-1 mt-4">
                <div class="flex items-center justify-end">
                  <Button @click="closeModal" label="Cancelar" color="bg-red-700" class="mr-2" />
                  <Button @click="create" label="Criar" color="bg-green-700" />
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