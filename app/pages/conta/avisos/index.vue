<script setup lang="ts">
    import { useParams } from '../../../stores/params.js';
    import { collection, getDocs, query, where,
        getCountFromServer, orderBy,
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
    const totalResult = ref<any>(0)
    const warnings = ref<any[]>([])
    const loading = ref<boolean>(true)
    const currentPage = ref<number>(1)
    const authentication: any = useAuthentication();
    const nextPage = ref<boolean>(false)
    const lastVisible = ref<any>()
    const docs = ref<any>([])
    const initVisible = ref<any>()
    
    const getWarnings = async () => {
        try {
            let constraints = [
                orderBy("created_at", "desc"),
                limit(13),
                where("user_id", "==", authentication.user.id)
            ];
            let r = query(collection(firestore, "Warnings"), ...constraints);
            const snapshot = await getCountFromServer(r);
            totalResult.value = snapshot.data().count
            constraints.push(limit(13))
            let q = query(collection(firestore, "Warnings"), ...constraints);
            const querySnapshot = await getDocs(q);
            warnings.value = []
            querySnapshot.forEach((doc) => {
                warnings.value.push({
                    id: doc.id,
                    ...doc.data()
                })
            });
            if(warnings.value.length > 12) {
                nextPage.value = true
                lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
                warnings.value.pop()
            } else {
                nextPage.value = false
            }
            loading.value = false
        } catch(error) {
            console.log(error)
        }
    }
    const getMoreWarnings = async (isPreview: boolean) => {
        let q: any
        if(isPreview) {
            let end = nextPage.value ? initVisible.value : lastVisible.value
            let constraints = [
                orderBy("created_at", "desc"),
                where("user_id", "==", authentication.user.id),
                endAt(end),
                limitToLast(13),
            ];
            q = query(collection(firestore, "Warnings"), ...constraints);
        } else {
            let constraints = [
                orderBy("created_at", "desc"),
                where("user_id", "==", authentication.user.id),
                startAt(lastVisible.value),
                limit(13),
            ];
            q = query(collection(firestore, "Warnings"), ...constraints);
        } 
        const querySnapshot = await getDocs(q);
        warnings.value = []
        querySnapshot.forEach((doc: any) => {
            warnings.value.push({
                id: doc.id,
                ...doc.data()
            })
        });
        if(warnings.value.length > 12) {
            nextPage.value = true
            docs.value = querySnapshot.docs
            lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
            initVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
            warnings.value.pop()
        } else {
            nextPage.value = false
        }
        loading.value = false
    }
    const changeGetWarnings = async (isChange: boolean, mode: number) => {
        let isPreview = false
        if(isChange) {
            await getWarnings()
        } else {
            if(mode === 1) {
                currentPage.value--
                isPreview = true
            } else {
                currentPage.value++
            }
            await getMoreWarnings(isPreview)
        }
    }

    onMounted(() => {
        getWarnings()
    })

    onBeforeMount(() => {
        params.changeRouteCurrent('warnings')
    })
</script>

<template>
    <main class="container mx-auto px-4 max-w-4xl">
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center space-y-3">
                <h2 class="text-3xl font-bold text-gray-800">Meus Avisos</h2>
                <p class="text-gray-600 max-w-2xl mx-auto">
                    Fique por dentro de tudo através dos avisos
                </p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            <!-- Content -->
            <div v-else class="space-y-6">
                <!-- warnings Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                        v-for="warning in warnings" 
                        :key="warning.id"
                        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
                    >
                        <!-- Warning Header -->
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {{ warning.title }}
                                </h3>
                                <p class="text-gray-500 text-[0.8rem] mt-1">{{ convertDateFirestore(warning.created_at) }}</p>
                            </div>
                            <div class="flex-shrink-0 ml-3">
                                <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                            </div>
                        </div>

                        <!-- Description -->
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {{ warning.description || 'Sem descrição' }}
                        </p>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="warnings.length === 0" class="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <div class="text-gray-400 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="text-gray-600 font-medium text-lg mb-2">Nenhum aviso encontrado</h3>
                </div>

                <!-- Pagination -->
                <div v-if="warnings.length > 0" class="flex justify-center">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <div class="flex items-center space-x-1">
                            <!-- Previous Button -->
                            <button 
                                v-if="currentPage > 1"
                                @click="changeGetWarnings(false, 1)"
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
                                @click="changeGetWarnings(false, 2)"
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
    <CreateGroupModal v-model="isCreateGroupModal" @create="getWarnings()" />
</template>
