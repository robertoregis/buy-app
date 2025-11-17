<script setup lang="ts">
  import { collection, getDocs, query, where,
    getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
    limit,startAt, limitToLast, endAt
  } from 'firebase/firestore';
  import { useFirebase } from '../../../composables/useFirebase';
  import { useParams } from '../../../stores/params.js';
  import { useAuthentication } from '../../../stores/authentication.js';
  import { convertDateFirestoreFriends } from '../../../composables/convert.js';

  const params = useParams();
  definePageMeta({
    layout: 'dashboard'
  })
  const isView = ref<boolean>(false)
  const router = useRouter();
  const { firestore } = useFirebase();
  const authentication: any = useAuthentication();
  const totalResult = ref<any>(0)
  const friends = ref<any[]>([])
  const loading = ref<boolean>(true)
  const currentPage = ref<number>(1)
  const nextPage = ref<boolean>(false)
  const lastVisible = ref<any>()
  const docs = ref<any>([])
  const initVisible = ref<any>()
  const userFriendSelected = ref<any>({});
  const isShowUserFriend = ref<boolean>(false);

  const getFriends = async () => {
        try {
            loading.value = true

            // Query base para contagem
            const countQuery = query(
            collection(firestore, "Friendships"),
                where("is_active", "==", true),
                where('friends', 'array-contains', authentication.userId)
            )
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // Query para buscar os dados
            const q = query(
            collection(firestore, "Friendships"),
                where("is_active", "==", true),
                where('friends', 'array-contains', authentication.userId),
                orderBy("created_at", "desc"),
                limit(13)
            )

            const querySnapshot = await getDocs(q)
            const friendsDocs = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))

            if (friends.value.length > 12) {
              nextPage.value = true
              lastVisible.value = querySnapshot.docs[querySnapshot.docs.length - 1]
              friends.value.pop() // remove o 13º
            } else {
              nextPage.value = false
            }

            // 3. Cria um array de Promises para buscar o perfil de cada usuário (coleção 'Users')
            const userDetailsPromises = friendsDocs.map(async (request: any) => {
              const userTheyId = request.user_from.id === authentication.userId ? request.user_to.id : request.user_from.id
                
              const userDocRef = doc(firestore, "Users", userTheyId);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    return {
                        ...request,
                        userThey: {
                          name: userData.name,
                          email: userData.email,
                          image_url: userData.image_url || null
                        }
                    };
                } else {
                    // Caso o documento em Users tenha sido deletado ou não exista
                    return {
                        ...request,
                        userThey: {
                          name: 'Usuário não encontrado',
                          email: '-',
                          image_url: null
                        }
                    };
                }
            });

            // 4. Espera todas as Promises terminarem para ter a lista final de participantes
            friends.value = await Promise.all(userDetailsPromises);
        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    const getMoreFriends = async (isPreview: boolean) => {
      let q: any
      if(isPreview) {
          let end = nextPage.value ? initVisible.value : lastVisible.value
          let constraints = [
              orderBy("created_at", "desc"),
              endAt(end),
              limitToLast(13),
              where('is_active', "==", true),
              where('friends', 'array-contains', authentication.userId)
          ];
          q = query(collection(firestore, "Friendships"), ...constraints);
      } else {
          let constraints = [
              orderBy("created_at", "desc"),
              startAt(lastVisible.value),
              limit(13),
              where('is_active', "==", true),
              where('friends', 'array-contains', authentication.userId)
          ];
          q = query(collection(firestore, "Friendships"), ...constraints);
      } 
      const querySnapshot = await getDocs(q);
      friends.value = []
      querySnapshot.forEach((doc: any) => {
          friends.value.push({
              id: doc.id,
              ...doc.data()
          })
      });
      if(friends.value.length > 12) {
          nextPage.value = true
          docs.value = querySnapshot.docs
          lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
          initVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
          friends.value.pop()
      } else {
          nextPage.value = false
      }
      loading.value = false
    }
    const changeGetFriends = async (isChange: boolean, mode: number) => {
      let isPreview = false
      if(isChange) {
          await getFriends()
      } else {
          if(mode === 1) {
              currentPage.value--
              isPreview = true
          } else {
              currentPage.value++
          }
          await getMoreFriends(isPreview)
      }
    }

  const showUser = (user: any) => {
    userFriendSelected.value = {}
    userFriendSelected.value = user.userThey
    isShowUserFriend.value = true
  }

  onMounted(() => {
    getFriends()
  })
  
</script>

<template>
  <main class="container mx-auto px2 lg:px-4 max-w-6xl">
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-800">Meus Amigos</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Conecte-se e compartilhe compras com seus amigos
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col md:flex-row items-center md:justify-center space-y-2 md:space-y-0 md:space-x-4">
        <NuxtLink 
          to="/conta/amigos/pedidos" 
          class="relative bg-green-600 hover:bg-green-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
        >
          <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          <span>Ver Pedidos</span>
          <div v-if="authentication.countFriendRequests > 0" class="absolute top-[-7px] right-[-7px] p-2 w-[20px] h-[20px] rounded-full bg-green-500 flex justify-center items-center">
            <span class="font-bold inline-block align-middle">{{ authentication.countFriendRequests }}</span>
          </div>
        </NuxtLink>
        
        <NuxtLink 
          to="/conta/amigos/criar-pedido" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
        >
          <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Adicionar Amigo</span>
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Friends Grid -->
      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-gray-800">
            Lista de Amigos
          </h3>
          <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
            {{ friends.length }} amigo{{ friends.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div v-if="friends.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div 
            v-for="friend in friends" 
            :key="friend.id"
            @click="showUser(friend)"
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
          >
            <!-- Friend Info -->
            <div class="flex items-center space-x-4 mb-4">
              <div class="flex-shrink-0 relative">
                <img 
                  :src="friend.userThey.image_url || 'https://firebasestorage.googleapis.com/v0/b/buy-app-8c9ec.firebasestorage.app/o/avatar.png?alt=media&token=ae2cef95-b633-491a-9394-4723e541e8e2'" 
                  :alt="friend.userThey.name"
                  class="w-10 h-10 lg:w-16 lg:h-16 rounded-full border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                />
                <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 text-base md:text-lg group-hover:text-blue-600 transition-colors truncate">
                  {{ friend.userThey.name }}
                </h3>
                <p class="text-gray-500 text-sm truncate">
                  {{ friend.userThey.email }}
                </p>
              </div>
            </div>

            <!-- Friendship Info -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
              <div class="flex items-center space-x-2 text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-xs font-medium">
                  Amigos desde {{ convertDateFirestoreFriends(friend.created_at) }}
                </span>
              </div>
              
              <!-- View Profile -->
              <div class="text-blue-500 group-hover:text-blue-600 transition-colors">
                <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div class="text-gray-400 mb-4">
            <svg class="w-10 h-10 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
          </div>
          <h3 class="text-gray-600 font-medium text-lg mb-2">Nenhum amigo encontrado</h3>
          <p class="text-gray-500 mb-6">Adicione amigos para compartilhar compras e grupos</p>
          <div class="flex justify-center space-y-2 md:space-y-0 space-x-4">
            <NuxtLink 
              to="/conta/amigos/criar-pedido" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 lg:px-6 lg:py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Adicionar Amigo
            </NuxtLink>
            <NuxtLink 
              to="/conta/amigos/pedidos" 
              class="relative bg-green-600 hover:bg-green-700 text-white px-3 py-1 lg:px-6 lg:py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <span>Ver pedidos</span>
              <div v-if="authentication.countFriendRequests > 0" class="absolute top-[-7px] right-[-7px] p-2 w-[20px] h-[20px] rounded-full bg-green-500 flex justify-center items-center">
                <span class="font-bold inline-block align-middle">{{ authentication.countFriendRequests }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="friends.length > 0" class="flex justify-center">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div class="flex items-center space-x-1">
              <!-- Previous Button -->
              <button 
                v-if="currentPage > 1"
                @click="changeGetFriends(false, 1)"
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
                @click="changeGetFriends(false, 2)"
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
    </div>
  </main>

  <!-- Modal (Keep exactly as it is) -->
  <Participant v-model="isShowUserFriend" :participant="userFriendSelected" />
</template>

<style lang="scss" scoped>
</style>
