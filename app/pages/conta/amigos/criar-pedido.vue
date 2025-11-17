<script setup lang="ts">
  import { useParams } from '../../../stores/params.js';
  import { collection, getDocs, query, where,
    getCountFromServer, orderBy,
    limit,startAt, limitToLast, endAt
  } from 'firebase/firestore';
  import { useFirebase } from '../../../composables/useFirebase';
  import { useAuthentication } from '../../../stores/authentication';

  const params = useParams();
  definePageMeta({
    layout: 'dashboard'
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
  const search = ref<any>('')
  const router = useRouter();
  const usersFound = ref<any[]>([])
  const isCreateFriendRequest = ref<boolean>(false);
  const usersFormData = ref<any>({})
  const loadedSearch = ref<boolean>(false);

  const clear = () => {
    search.value = ''
    loadedSearch.value = false
    usersFound.value = []
  }

  const getUsers = async () => {
    const userInput = search.value;
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
    loadedSearch.value = true;
  }
  const getMoreUsers = async (isPreview: boolean) => {
    const userInput = search.value;
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
    loading.value = false
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

  const userAdd = async (user: any) => {
    //usersAdded.value.push(user)
    const users = {
      me: {
        id: authentication.userId,
        name: authentication.user.name,
        email: authentication.user.email
      },
      they: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
    usersFormData.value = users;
    isCreateFriendRequest.value = true;
  }

  
</script>

<template>
  <main class="container mx-auto px-2 lg:px-4 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-800">Enviar Pedido de Amizade</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Pesquise por usuários para enviar solicitações de amizade
        </p>
      </div>

      <!-- Search Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div class="space-y-4">
          <!-- Instructions -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Pesquise pelo nome do usuário
            </h3>
            <p class="text-gray-500 text-sm">
              Digite pelo menos 4 caracteres para buscar usuários
            </p>
          </div>

          <!-- Search Form -->
          <div class="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div class="flex-1 max-w-md">
              <div class="relative">
                <input 
                  v-model="search"
                  @keyup.enter="search.length > 3 ? getUsers() : null"
                  type="text" 
                  placeholder="Digite o nome do usuário..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white pl-11"
                >
                <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div class="flex gap-3">
              <button 
                @click="getUsers"
                :disabled="search.length < 4"
                :class="[
                  'px-3 py-1 lg:px-6 lg:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
                  search.length >= 4 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span>Pesquisar</span>
              </button>
              
              <button 
                @click="clear"
                :disabled="search.length < 1"
                :class="[
                  'px-3 py-1 lg:px-6 lg:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
                  search.length >= 1 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="loadedSearch" class="space-y-6">
        <!-- Results Header -->
        <div class="flex flex-col items-start md:items-center md:justify-between space-y-2 md:space-y-0">
          <h3 class="text-xl font-bold text-gray-800">
            Resultados da Pesquisa
          </h3>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {{ usersFound.length }} usuário{{ usersFound.length !== 1 ? 's' : '' }} encontrado{{ usersFound.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Users Grid -->
        <div v-if="usersFound.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div 
            v-for="user in usersFound" 
            :key="user.id"
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-all duration-200"
          >
            <!-- User Info -->
            <div class="flex items-center space-x-4 mb-4">
              <div class="flex-shrink-0">
                <img 
                  :src="user.image_url || 'https://firebasestorage.googleapis.com/v0/b/buy-app-8c9ec.firebasestorage.app/o/avatar.png?alt=media&token=ae2cef95-b633-491a-9394-4723e541e8e2'" 
                  :alt="user.name"
                  class="w-12 h-12 rounded-full border-2 border-gray-200"
                />
              </div>
              
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 text-lg truncate">
                  {{ user.name }}
                </h4>
                <p class="text-gray-500 text-sm truncate">
                  {{ user.email }}
                </p>
              </div>
            </div>

            <!-- Add Friend Button -->
            <button 
              @click="userAdd(user)"
              class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              <span>Enviar Pedido</span>
            </button>
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div class="text-gray-400 mb-3">
            <svg class="w-10 h-10 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
          </div>
          <h3 class="text-gray-600 font-medium text-lg mb-2">Nenhum usuário encontrado</h3>
          <p class="text-gray-500">
            Tente buscar com outros termos ou verifique a ortografia
          </p>
        </div>

        <!-- Pagination -->
        <div v-if="usersFound.length > 0" class="flex justify-center">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div class="flex items-center space-x-1">
              <!-- Previous Button -->
              <button 
                v-if="currentPage > 1"
                @click="changeGetUsers(false, 1)"
                class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div 
                v-else
                class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"
              >
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </div>

              <!-- Current Page -->
              <div class="px-4 py-2">
                <span class="text-sm lg:text-base text-gray-700 font-semibold">
                  Página {{ currentPage }}
                </span>
              </div>

              <!-- Next Button -->
              <button 
                v-if="nextPage"
                @click="changeGetUsers(false, 2)"
                class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <div 
                v-else
                class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"
              >
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
        <div class="text-gray-400 mb-4">
          <svg class="w-10 h-10 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-gray-600 font-medium text-lg mb-2">Busque por usuários</h3>
        <p class="text-gray-500">
          Digite o nome de um usuário acima para começar a busca
        </p>
      </div>
    </div>
  </main>

  <!-- Modal (Keep exactly as it is) -->
  <CreateFriendRequest v-model="isCreateFriendRequest" :users="usersFormData" />
</template>

<style lang="scss" scoped>
</style>
