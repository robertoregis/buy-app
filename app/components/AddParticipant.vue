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
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
    @click="handleBackdropClick"
  >
    <div
      class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100"
    >
      <!-- Cabeçalho do modal -->
      <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl md:text-2xl font-bold">Adicionar Participante</h2>
            <p class="text-purple-100 text-sm mt-1">
              {{ type === 'group' ? 'Adicione membros ao seu grupo' : 'Adicione participantes a esta compra' }}
            </p>
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
          <div class="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
            <Icon name="mdi:account-search" class="text-purple-600 text-xl" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Buscar Usuários</h3>
          <p class="text-gray-500 text-sm">
            Digite pelo menos 4 caracteres para buscar usuários
          </p>
        </div>

        <!-- Formulário de Busca -->
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Nome do Usuário
              <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="flex-1 relative">
                <input 
                  @keyup.enter.prevent="formdata.name.length > 3 && getUsers()"
                  v-model="formdata.name"
                  type="text"
                  placeholder="Digite o nome do usuário..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white placeholder-gray-400 pr-11"
                >
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Icon name="mdi:account" class="text-gray-400 text-lg" />
                </div>
              </div>
              <div class="flex gap-2">
                <button 
                  @click.prevent.stop="clear()"
                  :disabled="formdata.name.length < 1"
                  :class="[
                    'px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center sm:space-x-2',
                    formdata.name.length >= 1
                      ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  ]"
                >
                  <Icon name="mdi:close-circle" class="text-lg" />
                  <span class="hidden sm:block">Limpar</span>
                </button>
                <button 
                  @click.prevent.stop="getUsers()"
                  :disabled="formdata.name.length < 4"
                  :class="[
                    'px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center sm:space-x-2',
                    formdata.name.length >= 4
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  ]"
                >
                  <Icon name="mdi:magnify" class="text-lg" />
                  <span class="hidden sm:block">Pesquisar</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Resultados da Busca -->
          <div v-if="loadingSearch" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-semibold text-gray-800">Resultados</h4>
              <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                {{ usersFound.length }} usuário{{ usersFound.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <div v-if="usersFound.length > 0" class="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              <div 
                v-for="participant in usersFound" 
                :key="participant.id"
                @click="addParticipant(participant)"
                class="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group"
              >
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <img 
                      :src="participant.image_url || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User'"
                      :alt="participant.name"
                      class="w-12 h-12 rounded-full border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                      {{ participant.name }}
                    </h5>
                    <p class="text-gray-500 text-sm truncate">
                      {{ participant.email }}
                    </p>
                  </div>
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon name="mdi:plus" class="text-white text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nenhum resultado -->
            <div v-else class="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <div class="text-gray-400 mb-3">
                <Icon name="mdi:account-off" class="text-4xl mx-auto" />
              </div>
              <p class="text-gray-600 font-medium">Nenhum usuário encontrado</p>
              <p class="text-gray-500 text-sm mt-1">
                Tente buscar com outros termos
              </p>
            </div>
          </div>

          <!-- Estado inicial -->
          <div v-else class="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
            <div class="text-gray-400 mb-3">
              <Icon name="mdi:account-search" class="text-4xl mx-auto" />
            </div>
            <p class="text-gray-600 font-medium">Busque por usuários</p>
            <p class="text-gray-500 text-sm mt-1">
              Os resultados aparecerão aqui
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div class="flex items-center justify-end">
          <button
            @click="closeModal"
            class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Fechar
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
input::placeholder {
  color: #9CA3AF;
  opacity: 1;
}

/* Focus states */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}
</style>