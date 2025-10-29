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
  const isCreateNewModal = ref<boolean>(false)
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

            console.log(friends.value)
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
  <main class="container mx-auto">
    <div class="grid grid-cols">
      <div class="col-span-1 mt-4">
          <h2 class="text-center text-2xl font-[600]">Amigos</h2>
      </div>

      <div class="col-span-1 mt-4">
        <div class="flex justify-center items-center">
          <NuxtLink to="/conta/amigos/pedidos" class="bg-green-700 text-white px-5 py-1 rounded">Pedidos</NuxtLink>
        </div>
      </div>
      <div class="col-span-1 mt-6">
          <div class="grid grid-cols-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <template v-for="friend in friends" :key="friend.id">
                <div @click="showUser(friend)" role="dialog" tabindex="0" class="cursor-pointer col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <span class="font-weight-500 text-[0.650rem]">{{ convertDateFirestoreFriends(friend.created_at) }}</span>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">{{ friend.userThey.name }}</span>
                    </div>
                  </div>
                </div>
              </template>

                <!--<div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <div class="flex items-center">
                        <button class="flex">
                          <Icon name="mdi:close-circle" class="text-red-700 text-xl" />
                        </button>
                        <button class="flex ml-1">
                          <Icon name="mdi:check-circle" class="text-green-700 text-xl" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <div class="flex items-center">
                        <button class="flex">
                          <Icon name="mdi:plus-box" class="text-green-700 text-xl" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <div class="flex items-center">
                        <button class="flex">
                          <Icon name="mdi:close-circle" class="text-red-700 text-xl" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>-->

              </div>
          </div>
      </div>
    </div>
  </main>
  <!--
  <main>
    <div class="container p-6">
      <div class="grid grid-cols-1">
        <div class="w-[100%] max-w-[1000px]">
          <div class="grid grid-cols-1">
            <div class="col-span-1">
              <div class="grid grid-cols-1 mt-4">
                <div class="col-span-1">
                  <div class="grid grid-cols-1 bg-white p-2 shadow-lg border-1 border-neutral-200">
                    <div class="col-span-1">
                      <h2 class="text-lg mb-0">Amigos</h2>
                    </div>
                    <div class="col-span-1 mt-2">
                      <div class="flex items-center">
                        <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                        <span class="ml-3">Nome da pessoa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 mt-4">
                <div class="col-span-1">
                  <div class="grid grid-cols-1 bg-white p-2 shadow-lg border-1 border-neutral-200">
                    <div class="col-span-1">
                      <div class="w-[68px] h-[68px] rounded-full bg-blue-200"></div>
                      <h2 class="text-lg mb-0">Fulano</h2>
                    </div>
                    <div class="col-span-1 mt-2">
                      <div class="flex flex-col">
                        <div class="flex items-center">
                          <span>Amizade desde:</span>
                          <span class="ml-2 font-weight-500">29/10/2025</span>
                        </div>
                        <div class="flex items-center">
                          <span>Compras feitas com você:</span>
                          <span class="ml-2 font-weight-500">21</span>
                        </div>
                        <div class="flex items-center">
                          <span>Ranking de amizade:</span>
                          <span class="ml-2 font-weight-500">1˚</span>
                        </div>
                      </div>
                    </div>

                    <div class="col-span-1 mt-4">
                      <div class="grid grid cols-1">
                        <div class="col-span-1">
                          <h1 class="mb-0 text-xl">Organizações que os dois participam juntos</h1>
                        </div>
                        <div class="col-span-1 mt-2">
                          <grid class="grid-cols-1 gap-2">
                            <div class="col-span-1 bg-teal-100 p-2 shadow rounded">
                              <div class="flex items-center">
                                <span>dkdkkdkddk</span>
                                <span>dllddlld</span>
                              </div>
                            </div>
                          </grid>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>-->
  <Participant v-model="isShowUserFriend" :participant="userFriendSelected" />
</template>

<style lang="scss" scoped>
</style>
