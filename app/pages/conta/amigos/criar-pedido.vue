<script setup lang="ts">
  import { useParams } from '../../../stores/params.js';
  import { collection, getDocs, query, where,
    getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
    limit,startAt, limitToLast, endAt
  } from 'firebase/firestore';
  import { useFirebase } from '../../../composables/useFirebase';
  import { useAuthentication } from '../../../stores/authentication';
  import { convertDateFirestore } from '../../../composables/convert.js';
  import { createFriendRequest } from '../../../composables/firebaseDocs.js';

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
  const usersAdded = ref<any[]>([])
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

  onMounted(() => {
    //router.push(`/`)
  })
  
</script>

<template>
  <main class="container mx-auto">
    <div class="grid grid-cols">
      <div class="col-span-1 mt-4">
          <h2 class="text-center text-2xl font-[600]">Criar pedido de amizade</h2>
      </div>

      <div class="col-span-1 mt-4">
        <div class="grid grid-cols-1">
          <div class="col-span-1">
            <div class="flex flex-col">
              <h2 class="font-weight-500">Pesquise o possível amigo pelo nome.</h2>
            </div>
            <div class="flex items-center max-w-[500px] justify-bettwen mt-2">
              <div class="flex flex-col relative w-[400px]">
                <label v-if="search" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Nome:</label>
                <input @keyup.enter="search.length > 3 ? getUsers() : null" v-model="search" type="text" name="" id="" placeholder="Nome" :class="`${search ? 'mt-1' : ''}`" class="border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
              </div>
              <Button @click="getUsers" label="Pesquisar" color="bg-green-700 ml-3" :class="`${search.length < 4 ? 'my-button-disable' : ''}`" />
              <Button @click="clear" label="Limpar" color="bg-gray-700 ml-3" :class="`${search.length < 1 ? 'my-button-disable' : ''}`" />
            </div>
          </div>

          <div v-if="loadedSearch" class="col-span-1 mt-4">
            <p class="font-[600]">Encontrados</p>
            <div v-if="usersFound.length > 0" class="grid grid-cols-3 gap-3">
              <template v-for="user in usersFound" :key="user.id">
              <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                <div class="flex flex-col">
                  <div class="flex justify-end">
                    <div class="flex items-center">
                      <button @click="userAdd(user)" class="flex cursor-pointer">
                        <Icon name="mdi:plus-box" class="text-green-700 text-lg" />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center mt-1">
                    <div class="w-[30px] h-[30px] rounded-full bg-blue-200"></div>
                    <span class="ml-3 text-sm">{{ user.name }}</span>
                  </div>
                </div>
              </div>
              </template>
            </div>
            <div v-else class="">
              <span>Nenhum usuário foi encontrado</span>
            </div>
          </div>

          <!--<div class="col-span-1 mt-4">
            <p class="font-[600]">Adicionados</p>
            <div v-if="usersAdded.length > 0" class="grid grid-cols-3 gap-3">
              <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                <div class="flex flex-col">
                  <div class="flex justify-end">
                    <div class="flex items-center">
                      <button class="flex cursor-pointer">
                        <Icon name="mdi:close-circle" class="text-red-700 text-lg" />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center mt-1">
                    <div class="w-[30px] h-[30px] rounded-full bg-blue-200"></div>
                    <span class="ml-3 text-sm">Nome da pessoa</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="">
              <span>Nenhum usuário foi adicionado</span>
            </div>
          </div>-->
        </div>
        
      </div>
    </div>
  </main>
  <CreateFriendRequest v-model="isCreateFriendRequest" :users="usersFormData" />
</template>

<style lang="scss" scoped>
</style>
