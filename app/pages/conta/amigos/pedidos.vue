<script setup lang="ts">
  import { collection, getDocs, query, where,
    getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
    limit,startAt, limitToLast, endAt
  } from 'firebase/firestore';
  import { useFirebase } from '../../../composables/useFirebase';
  import { useParams } from '../../../stores/params.js';
  import { useAuthentication } from '../../../stores/authentication.js';
  import { createFriendship, updateFriendRequest } from '../../../composables/firebaseDocs';
  const params = useParams();
  definePageMeta({
    layout: 'dashboard'
  })
  const { firestore } = useFirebase();
  const authentication: any = useAuthentication();
  const totalResult = ref<any>(0)
  const friendRequests = ref<any[]>([])
  const loading = ref<boolean>(true)
  const currentPage = ref<number>(1)
  const nextPage = ref<boolean>(false)
  const lastVisible = ref<any>()
  const docs = ref<any>([])
  const initVisible = ref<any>()
  const router = useRouter();

  const getFriendRequests = async () => {
        try {
            loading.value = true

            // Query base para contagem
            const countQuery = query(
            collection(firestore, "FriendRequests"),
                where("is_active", "==", true),
                where("user_to_id", "==", authentication.userId)
            )
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // Query para buscar os dados
            const q = query(
            collection(firestore, "FriendRequests"),
                where("is_active", "==", true),
                where("user_to_id", "==", authentication.userId),
                orderBy("created_at", "desc"),
                limit(13)
            )

            const querySnapshot = await getDocs(q)
            const friendRequestsDocs = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))

            if (friendRequests.value.length > 12) {
              nextPage.value = true
              lastVisible.value = querySnapshot.docs[querySnapshot.docs.length - 1]
              friendRequests.value.pop() // remove o 13º
            } else {
              nextPage.value = false
            }

            // 3. Cria um array de Promises para buscar o perfil de cada usuário (coleção 'Users')
            const userDetailsPromises = friendRequestsDocs.map(async (request: any) => {
              const userTheyId = request.user_from_id === authentication.userId ? request.user_to_id : request.user_from_id
                
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
            friendRequests.value = await Promise.all(userDetailsPromises);

        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    const getMoreFriendRequests = async (isPreview: boolean) => {
      let q: any
      if(isPreview) {
          let end = nextPage.value ? initVisible.value : lastVisible.value
          let constraints = [
              orderBy("created_at", "desc"),
              endAt(end),
              limitToLast(13),
              where('is_active', "==", true),
              where("user_to_id", "==", authentication.userId)
          ];
          q = query(collection(firestore, "FriendRequests"), ...constraints);
      } else {
          let constraints = [
              orderBy("created_at", "desc"),
              startAt(lastVisible.value),
              limit(13),
              where('is_active', "==", true),
              where("user_to_id", "==", authentication.userId)
          ];
          q = query(collection(firestore, "FriendRequests"), ...constraints);
      } 
      const querySnapshot = await getDocs(q);
      friendRequests.value = []
      querySnapshot.forEach((doc: any) => {
          friendRequests.value.push({
              id: doc.id,
              ...doc.data()
          })
      });
      if(friendRequests.value.length > 12) {
          nextPage.value = true
          docs.value = querySnapshot.docs
          lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
          initVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
          friendRequests.value.pop()
      } else {
          nextPage.value = false
      }
      loading.value = false
    }
    const changeGetFriendRequests = async (isChange: boolean, mode: number) => {
      let isPreview = false
      if(isChange) {
          await getFriendRequests()
      } else {
          if(mode === 1) {
              currentPage.value--
              isPreview = true
          } else {
              currentPage.value++
          }
          await getMoreFriendRequests(isPreview)
      }
    }

  const recusedFriendRequest = async (friendRequest: any) => {
    try {
      await updateFriendRequest(true, friendRequest.id)
      alert('Pedido recusado')
      router.push('/conta/amigos')
    } catch(error) {
      console.log(error)
    }
  }

  const acceptFriendRequest = async (friendRequest: any) => {
    try {
      await createFriendship(
        { id: friendRequest.user_from_id, name: friendRequest.userThey.name, email: friendRequest.userThey.email },
        {id: authentication.user.id, name: authentication.user.name, email: authentication.user.email },
        friendRequest.id
      )
      alert('Pedido aceito')
      router.push('/conta/amigos')
    } catch(error) {
      console.log(error)
    }
  }

  onMounted(() => {
    getFriendRequests()
  })
  
</script>

<template>
  <main class="container mx-auto px-4 max-w-6xl">
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <h2 class="text-3xl font-bold text-gray-800">Pedidos de Amizade</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Gerencie os pedidos de amizade recebidos
        </p>
      </div>

      <!-- Create Request Button -->
      <div class="flex justify-center">
        <NuxtLink 
          to="/conta/amigos/criar-pedido" 
          class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          <span>Enviar Pedido de Amizade</span>
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Friend Requests Grid -->
      <div v-else class="space-y-6">
        <div v-if="friendRequests.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="friendRequest in friendRequests" 
            :key="friendRequest.id"
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
          >
            <!-- User Info -->
            <div class="flex items-center space-x-4 mb-4">
              <div class="flex-shrink-0 relative">
                <img 
                  :src="friendRequest.userThey.image_url || '/placeholder-user.png'" 
                  :alt="friendRequest.userThey.name"
                  class="w-16 h-16 rounded-full border-2 border-gray-200"
                />
                <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 text-lg truncate">
                  {{ friendRequest.userThey.name }}
                </h3>
                <p class="text-gray-500 text-sm truncate">
                  {{ friendRequest.userThey.email }}
                </p>
              </div>
            </div>

            <!-- Request Info -->
            <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center space-x-2 text-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-medium">Pedido enviado</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button 
                @click="recusedFriendRequest(friendRequest)"
                class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <span>Recusar</span>
              </button>
              
              <button 
                @click="acceptFriendRequest(friendRequest)"
                class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Aceitar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h3 class="text-gray-600 font-medium text-lg mb-2">Nenhum pedido de amizade</h3>
          <p class="text-gray-500 mb-6">Você não tem pedidos de amizade pendentes no momento</p>
          <NuxtLink 
            to="/conta/amigos/criar-pedido" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Enviar Primeiro Pedido
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div v-if="friendRequests.length > 0" class="flex justify-center">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div class="flex items-center space-x-1">
              <!-- Previous Button -->
              <button 
                v-if="currentPage > 1"
                @click="changeGetFriendRequests(false, 1)"
                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div 
                v-else
                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </div>

              <!-- Current Page -->
              <div class="px-4 py-2">
                <span class="text-gray-700 font-semibold">
                  Página {{ currentPage }}
                </span>
              </div>

              <!-- Next Button -->
              <button 
                v-if="nextPage"
                @click="changeGetFriendRequests(false, 2)"
                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <div 
                v-else
                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
</style>
