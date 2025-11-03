<script setup lang="ts">
    import { useParams } from '../../../stores/params.js';
    import { collection, getDocs, query, where,
        getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
        limit,startAt, limitToLast, endAt
    } from 'firebase/firestore';
    import { useFirebase } from '../../../composables/useFirebase';
    import { useAuthentication } from '../../../stores/authentication';
    import { convertDateFirestore } from '../../../composables/convert.js';

    const params = useParams();
    definePageMeta({
        layout: 'dashboard'
    })
    const { firestore } = useFirebase()
    const router = useRouter()
    const { notify } = useNotification();
    const isCreateGroupModal = ref<boolean>(false)
    const isGroupModal = ref<boolean>(false)
    const totalResult = ref<any>(0)
    const groups = ref<any[]>([])
    const loading = ref<boolean>(true)
    const currentPage = ref<number>(1)
    const authentication = useAuthentication();
    const nextPage = ref<boolean>(false)
    const lastVisible = ref<any>()
    const docs = ref<any>([])
    const initVisible = ref<any>()
    
    const getGroups = async () => {
        try {
            let constraints = [
                orderBy("created_at", "desc"),
                limit(13),
                where("members", 'array-contains', authentication.userId),
                where('is_active', "==", true),
                //where("is_closed", "==", false)
            ];
            let r = query(collection(firestore, "Groups"), ...constraints);
            const snapshot = await getCountFromServer(r);
            totalResult.value = snapshot.data().count
            constraints.push(limit(13))
            let q = query(collection(firestore, "Groups"), ...constraints);
            const querySnapshot = await getDocs(q);
            groups.value = []
            querySnapshot.forEach((doc) => {
                groups.value.push({
                    id: doc.id,
                    ...doc.data()
                })
            });
            console.log(groups.value)
            if(groups.value.length > 12) {
                nextPage.value = true
                lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
                groups.value.pop()
            } else {
                nextPage.value = false
            }
            loading.value = false
        } catch(error) {
            console.log(error)
        }
    }
    const getMoreGroups = async (isPreview: boolean) => {
        let q: any
        if(isPreview) {
            let end = nextPage.value ? initVisible.value : lastVisible.value
            let constraints = [
                orderBy("created_at", "desc"),
                endAt(end),
                limitToLast(13),
                where("members", 'array-contains', authentication.userId),
                where('is_active', "==", true),
            ];
            q = query(collection(firestore, "Groups"), ...constraints);
        } else {
            let constraints = [
                orderBy("created_at", "desc"),
                startAt(lastVisible.value),
                limit(13),
                where("members", 'array-contains', authentication.userId),
                where('is_active', "==", true),
            ];
            q = query(collection(firestore, "Groups"), ...constraints);
        } 
        const querySnapshot = await getDocs(q);
        groups.value = []
        querySnapshot.forEach((doc: any) => {
            groups.value.push({
                id: doc.id,
                ...doc.data()
            })
        });
        if(groups.value.length > 12) {
            nextPage.value = true
            docs.value = querySnapshot.docs
            lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
            initVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
            groups.value.pop()
        } else {
            nextPage.value = false
        }
        loading.value = false
    }
    const changeGetGroups = async (isChange: boolean, mode: number) => {
        let isPreview = false
        if(isChange) {
            await getGroups()
        } else {
            if(mode === 1) {
                currentPage.value--
                isPreview = true
            } else {
                currentPage.value++
            }
            await getMoreGroups(isPreview)
        }
    }

    const goGroup = (group: any) => {
        authentication.setGroup(group)
        localStorage.setItem('buy_group_id', group.id)
        router.push(`/conta/grupos/${group.id}`)
    }

    onMounted(() => {
        getGroups()
        /*notify({
            title: "Sucesso!",
            text: "Operação concluída com êxito.",
            type: "success", // 'success', 'error', 'warn', 'info' ou customizado
        });*/
    })

    onBeforeMount(() => {
        params.changeRouteCurrent('groups')
    })
</script>

<template>
    <main class="container mx-auto px-4 max-w-4xl">
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center space-y-3">
                <h2 class="text-3xl font-bold text-gray-800">Meus Grupos</h2>
                <p class="text-gray-600 max-w-2xl mx-auto">
                    Gerencie seus grupos de compras compartilhadas
                </p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            <!-- Content -->
            <div v-else class="space-y-6">
                <!-- Create Group Button -->
                <div class="flex justify-center">
                    <button 
                        @click="isCreateGroupModal = true"
                        class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Criar Novo Grupo</span>
                    </button>
                </div>

                <!-- Groups Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                        v-for="group in groups" 
                        :key="group.id"
                        @click="goGroup(group)"
                        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                    >
                        <!-- Group Header -->
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {{ group.name }}
                                </h3>
                                <p class="text-gray-500 text-sm mt-1">{{ convertDateFirestore(group.created_at) }}</p>
                            </div>
                            <div class="flex-shrink-0 ml-3">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                        </div>

                        <!-- Description -->
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {{ group.description || 'Sem descrição' }}
                        </p>

                        <!-- Members Info -->
                        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div class="flex items-center space-x-2 text-gray-500">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                </svg>
                                <span class="text-xs font-medium">
                                    {{ group.members?.length || 1 }} membro{{ group.members?.length !== 1 ? 's' : '' }}
                                </span>
                            </div>
                            
                            <!-- CTA Arrow -->
                            <div class="text-blue-500 group-hover:text-blue-600 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="groups.length === 0" class="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <div class="text-gray-400 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                    </div>
                    <h3 class="text-gray-600 font-medium text-lg mb-2">Nenhum grupo encontrado</h3>
                    <p class="text-gray-500 mb-6">Crie seu primeiro grupo para começar a compartilhar compras</p>
                    <button 
                        @click="isCreateGroupModal = true"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                        Criar Primeiro Grupo
                    </button>
                </div>

                <!-- Pagination -->
                <div v-if="groups.length > 0" class="flex justify-center">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <div class="flex items-center space-x-1">
                            <!-- Previous Button -->
                            <button 
                                v-if="currentPage > 1"
                                @click="changeGetGroups(false, 1)"
                                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="mdi:arrow-left" class="text-xl" />
                            </button>
                            <div 
                                v-else
                                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"
                            >
                                <Icon name="mdi:arrow-left" class="text-xl" />
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
                                @click="changeGetGroups(false, 2)"
                                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                            >
                                <Icon name="mdi:arrow-right" class="text-xl" />
                            </button>
                            <div 
                                v-else
                                class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"
                            >
                                <Icon name="mdi:arrow-right" class="text-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal (Keep exactly as it is) -->
    <CreateGroupModal v-model="isCreateGroupModal" @create="getGroups()" />
</template>
