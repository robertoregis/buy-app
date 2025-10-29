<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { vMaska } from "maska/vue";
import { createPurchase } from '../composables/firebaseDocs';
import { useAuthentication } from '../stores/authentication';

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
  directives: {
		maska: vMaska, // 👈 registra a diretiva
	},
  emits: ['update:modelValue', 'closed', 'created'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const newId = ref(props.newId);
    const router = useRouter();
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

    const send = async () => {
      if (!formdata.value.title) return alert('Escreva o nome');
      if (!formdata.value.description) return alert('Escreva a descrição');
      if (!formdata.value.version) return alert('Escolha a versão');
      if (!formdata.value.date) return alert('Escreva a data');

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
    class="fixed px-2 inset-0 bg-black/50 bg-opacity-50 z-100 flex justify-center items-center"
    @click="handleBackdropClick"
  >
    <div
      class="w-[600px] bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div class="text-xl font-semibold mb-2">{{ newId ? 'Editar' : 'Criar' }} compra</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols py-4">
          <div class="col-span-1">
            <div class="grid grid-cols-1">
              <div class="col-span-1">
                <div class="flex flex-col">
                  <div class="flex items-center">
                    <span class="text-[0.9rem]">Nome do grupo:</span>
                    <span class="text-sm ml-2 font-[600]">{{ authentication.group.name }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-[0.9rem]">Participantes:</span>
                    <span class="text-sm ml-2 font-[600]">{{ authentication.group.members.length }}</span>
                  </div>
                </div>
              </div>

              <div class="col-span-1 mt-4">
                <form action="" class="grid grid-cols-1">
                  <div class="col-span-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.title" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Título:</label>
                        <input v-model="formdata.title" type="text" name="" id="" placeholder="Título" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                    </div>
                  </div>
                  <div class="col-span-1 mt-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.description" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Descrição:</label>
                        <textarea v-model="formdata.description" rows="4" name="" id="" placeholder="Descrição" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1" />
                    </div>
                  </div>
                  <div class="col-span-1 mt-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.version" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Descrição:</label>
                        <select
                          v-model="formdata.version"
                          class="rounded-sm mt-1 border-2 border-gray-200 rounded bg-gray-200 text-[0.85rem] text-neutral-800 pl-3 pr-5 py-2 w-full"
                        >
                          <option disabled :value="null">Selecione a versão</option>
                          <option v-for="(version, index) in versions" :key="version" :value="version">
                          {{ version }}
                          </option>
                        </select>
                    </div>
                  </div>
                  <div class="col-span-1 mt-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.date" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Data planejada da compra:</label>
                        <input 
                          v-model="formdata.date"
                          v-maska
                          data-maska="##/##/####"
                          type="text"
                          name=""
                          id=""
                          placeholder="Data planejada da compra"
                          class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1"
                        >
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