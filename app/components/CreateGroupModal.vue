<script lang="ts">
  import { ref, defineComponent, watch } from 'vue';
  import { createGroup, createParticipantInGroup } from '../composables/firebaseDocs';
  import { useAuthentication } from '#imports';

  export default defineComponent({
    name: 'CreateNewModal',
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
        send
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
      <div class="text-xl font-semibold mb-2">{{ newId ? 'Editar' : 'Criar' }} grupo</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols py-4">
          <div class="col-span-1">
            <div class="grid grid-cols-1">
              <div class="col-span-1">
                <div class="flex flex-col">
                  <p>Preencha todos os campos</p>
                </div>
              </div>

              <div class="col-span-1 mt-4">
                <form action="" class="grid grid-cols-1">
                  <div class="col-span-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.name" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Título:</label>
                        <input v-model="formdata.name" type="text" name="" id="" placeholder="Título" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                    </div>
                  </div>
                  <div class="col-span-1 mt-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.description" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Descrição:</label>
                        <textarea v-model="formdata.description" rows="4" name="" id="" placeholder="Descrição" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1" />
                    </div>
                  </div>
                  <div class="col-span-1 mt-4">
                    <div class="flex items-center justify-end">
                      <Button @click.prevent="send" label="Criar" color="bg-green-700" />
                    </div>
                  </div>
                </form>
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