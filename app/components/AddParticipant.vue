<script lang="ts">
import { ref, defineComponent, watch } from 'vue';
import { vMaska } from "maska/vue";
import { collection, getDocs, query, where,
    getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
    limit,startAt, limitToLast, endAt
  } from 'firebase/firestore';
import { useFirebase } from '../composables/useFirebase';
import { useAuthentication } from '../stores/authentication';
import { createParticipantInGroup } from '../composables/firebaseDocs';

export default defineComponent({
  name: 'AddParticipant',
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
    type: {
      type: String,
      required: true
    },
    participants: {
      type: Array,
      required: true
    }
  },
  directives: {
		maska: vMaska, // 👈 registra a diretiva
	},
  emits: ['update:modelValue', 'closed', 'added'],
  setup(props, { emit }) {
    const isOpen = ref(props.modelValue);
    const type = ref(props.type);
    const participants = ref(props.participants)
    const router = useRouter();
    const { notify } = useNotification();
    const formdata = ref<any>({
      name: ''
    })
    const { firestore } = useFirebase()
    const totalResult = ref<any>(0)
    const loading = ref<boolean>(true)
    const currentPage = ref<number>(1)
    const authentication: any = useAuthentication();
    const nextPage = ref<boolean>(false)
    const lastVisible = ref<any>()
    const docs = ref<any>([])
    const initVisible = ref<any>()
    const usersFound = ref<any[]>([])
    const loadingSearch = ref<boolean>(false);

    const closeModal = () => {
      isOpen.value = false;
      formdata.value.name = '';
      totalResult.value = 0;
      loadingSearch.value = false;
      usersFound.value = [];
      emit('update:modelValue', false);
      emit('closed');
    };

    // Acompanhar se o estado do modal for alterado fora
    watch(() => props.modelValue, (newVal) => {
      isOpen.value = newVal;
    });
    watch(() => props.type, (newVal) => {
      type.value = newVal;
    });
    watch(() => props.participants, (newVal) => {
      participants.value = newVal;
    });

    // Fechar se o usuário clicar fora do modal (em um fundo opaco)
    const handleBackdropClick = (e: MouseEvent) => {
      if (props.closeOnBackdrop && e.target === e.currentTarget) {
        closeModal();
      }
    };
    const clear = () => {
      usersFound.value = [];
      loadingSearch.value = false;
      totalResult.value = 0;
      formdata.value.name = '';
    }

    const getUsers = async () => {
      const userInput = formdata.value.name;
      const nextInput = userInput + '\uf8ff';
      let q = query(collection(firestore, "Users"), where("name", ">=", userInput), where("name", "<", nextInput), orderBy("name", "desc"));
      const snapshot = await getCountFromServer(q);
      totalResult.value = snapshot.data().count
      q = query(q, limit(21))
      const querySnapshot = await getDocs(q);
      usersFound.value = []
      querySnapshot.forEach((doc) => {
          usersFound.value.push({
              id: doc.id,
              ...doc.data()
          })
      });
      if(usersFound.value.length > 20) {
          nextPage.value = true
          lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
          usersFound.value.pop()
      } else {
          nextPage.value = false
      }
      loadingSearch.value = true;
    }
    const getMoreUsers = async (isPreview: boolean) => {
      const userInput = formdata.value.name;
      const nextInput = userInput + '\uf8ff';
      let q: any
      if(isPreview) {
          let end = nextPage.value ? initVisible.value : lastVisible.value
          q = query(collection(firestore, "Users"), where("name", ">=", userInput), where("name", "<", nextInput), orderBy("name", "desc"), endAt(end), limitToLast(21));
      } else {
          q = query(collection(firestore, "Users"), where("name", ">=", userInput), where("name", "<", nextInput), orderBy("name", "desc"), startAt(lastVisible.value), limit(21));
      } 
      const querySnapshot = await getDocs(q);
      usersFound.value = []
      querySnapshot.forEach((doc: any) => {
          usersFound.value.push({
              id: doc.id,
              ...doc.data()
          })
      });
      if(usersFound.value.length > 20) {
          nextPage.value = true
          docs.value = querySnapshot.docs
          lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
          initVisible.value = querySnapshot.docs[querySnapshot.docs.length-21];
          usersFound.value.pop()
      } else {
          nextPage.value = false
      }
    }
  
    const changeGetUsers = async (isChange: boolean, mode: number) => {
      let isPreview = false
      if(isChange) {
          await getUsers()
      } else {
          if(mode === 1) {
              currentPage.value--
              isPreview = true
          } else {
              currentPage.value++
          }
          await getMoreUsers(isPreview)
      }
    }

    const addParticipant = async (participant: any) => {
      /*const idExiste = arrayPrincipal.some(objeto => {
        // Para cada 'objeto' no arrayPrincipal, verificamos se o idParaBuscar
        // está incluído no seu array 'idsSecundarios'.
        return objeto.idsSecundarios.includes(idParaBuscar);
      });*/
      const existsID = participants.value.some((p: any) => {
        return p.user_id === participant.id;
      });
      if(!existsID) {
        await createParticipantInGroup(authentication.group.id, {
          id: participant.id,
          name: participant.name,
          email: participant.email
        })
        closeModal()
        emit('added')
      } else {
        notify({
          text: 'O participante já está no grupo',
          type: 'error'
        })
      }
    }

    return {
      isOpen,
      closeModal,
      handleBackdropClick,
      formdata,
      getUsers,
      usersFound,
      clear,
      addParticipant,
      loadingSearch
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
      class="w-[540px] bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div class="text-xl font-semibold mb-2">Adicionar participante {{ type === 'group' ? 'no grupo' : 'na compra' }}</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols py-4">
          <div class="col-span-1">
            <div class="grid grid-cols-1">
              <div class="col-span-1">
                <div action="" class="grid grid-cols-1">
                  <div class="col-span-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.name" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Nome:</label>
                        <input @keyup.enter.prevent="formdata.name.length > 3 && getUsers()" v-model="formdata.name" type="text" name="" id="" placeholder="Nome" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                    </div>
                  </div>
                  <div class="col-span-1 mt-2">
                    <div class="flex items-center justify-end">
                      <Button @click.prevent.stop="clear()" label="Limpar" color="bg-gray-700" class="mr-2" :class="`${formdata.name.length < 1 ? 'my-button-disable' : ''}`" />
                      <Button @click.prevent.stop="getUsers()" label="Pesquisar" color="bg-green-700" :class="`${formdata.name.length < 4 ? 'my-button-disable' : ''}`" />
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="loadingSearch" class="col-span-1 mt-3">
                <div v-if="usersFound.length > 0" class="grid grid-cols-1 gap-2">
                  <template v-for="participant in usersFound" :key="participant.id">
                    <div @click="addParticipant(participant)" class="cursor-pointer col-span-1 p-2 shadow bg-gray-200 rounded">
                      <div class="flex items-center mt-1">
                          <div class="w-[42px] h-[42px] rounded-full shadow-lg border-1 p-1 border-black/10 overflow-hidden">
                            <img :src="participant.image_url" alt="">
                          </div>
                          <span class="ml-3">{{ participant.name }}</span>
                      </div>
                    </div>
                  </template>
                </div>
                <div v-else class="flex">
                  <span>Não encontrou nenhum usuário</span>
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