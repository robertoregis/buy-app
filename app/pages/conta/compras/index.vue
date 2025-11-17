<script setup lang="ts">
    import { collection, getDocs, query, where,
        getCountFromServer, orderBy,
        limit,startAt, limitToLast, endAt
    } from 'firebase/firestore';
    import { useFirebase } from '../../../composables/useFirebase';
    import { useParams } from '../../../stores/params.js';
    import { useAuthentication } from '../../../stores/authentication.js';
    import { convertDateFirestore } from '../../../composables/convert.js';

    const params = useParams();
    definePageMeta({
        layout: 'dashboard'
    })
    const { firestore } = useFirebase();
    const router = useRouter();
    const authentication: any = useAuthentication();
    const isCreatePurchaseModal = ref<boolean>(false)
    const totalResult = ref<any>(0)
    const purchases = ref<any[]>([])
    const loading = ref<boolean>(true)
    const currentPage = ref<number>(1)
    const nextPage = ref<boolean>(false)
    const lastVisible = ref<any>()
    const docs = ref<any>([])
    const initVisible = ref<any>()

    const getPurchases = async () => {
        try {
            loading.value = true

            const countQuery = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases"),
                where("is_active", "==", true),
            )
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            const q = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases"),
                where("is_active", "==", true),
                orderBy("created_at", "desc"),
                limit(13)
            )

            const querySnapshot = await getDocs(q)
            purchases.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

            if (purchases.value.length > 12) {
            nextPage.value = true
                lastVisible.value = querySnapshot.docs[querySnapshot.docs.length - 1]
                purchases.value.pop()
            } else {
                nextPage.value = false
            }
        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    const getMorePurchases = async (isPreview: boolean) => {
        let q: any
        if(isPreview) {
            let end = nextPage.value ? initVisible.value : lastVisible.value
            let constraints = [
                orderBy("created_at", "desc"),
                endAt(end),
                limitToLast(13),
                where('is_active', "==", true),
            ];
            q = query(collection(firestore, "Groups", authentication.group.id, "Purchases"), ...constraints);
        } else {
            let constraints = [
                orderBy("created_at", "desc"),
                startAt(lastVisible.value),
                limit(13),
                where('is_active', "==", true),
            ];
            q = query(collection(firestore, "Groups", authentication.group.id, "Purchases"), ...constraints);
        } 
        const querySnapshot = await getDocs(q);
        purchases.value = []
        querySnapshot.forEach((doc: any) => {
            purchases.value.push({
                id: doc.id,
                ...doc.data()
            })
        });
        if(purchases.value.length > 12) {
            nextPage.value = true
            docs.value = querySnapshot.docs
            lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
            initVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
            purchases.value.pop()
        } else {
            nextPage.value = false
        }
        loading.value = false
    }
    const changeGetPurchases = async (isChange: boolean, mode: number) => {
        let isPreview = false
        if(isChange) {
            await getPurchases()
        } else {
            if(mode === 1) {
                currentPage.value--
                isPreview = true
            } else {
                currentPage.value++
            }
            await getMorePurchases(isPreview)
        }
    }

    const openPurchase = (purchase: any) => {
        router.push(`/conta/compras/${purchase.id}/exibir`)
    }

    // Calcular economia
    const calculateSavings = (purchase: any) => {
        const planned = Number(purchase.price_planned) || 0;
        const final = Number(purchase.price_final) || 0;
        const savings = planned - final;
        return {
            amount: savings,
            formatted: `R$ ${Math.abs(savings).toFixed(2)}`,
            isPositive: savings > 0
        };
    }

    // Formatar data
    /*const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Data não disponível';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }*/

    onBeforeMount(() => {
        params.changeRouteCurrent('purchases')
    })

    onMounted(() => {
        if(!Object.keys(authentication.group || {}).length) {
            router.push('/conta/grupos')
        } else {
            getPurchases()
        }
    })
</script>

<template>
    <main class="container mx-auto px2 lg:px-4 max-w-6xl">
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center space-y-3">
                <h2 class="text-2xl lg:text-3xl font-bold text-gray-800">Lista de Compras</h2>
                <p class="text-gray-600 max-w-2xl mx-auto">
                    Gerencie todas as compras do seu grupo
                </p>
            </div>

            <!-- Create Button -->
            <div class="flex justify-center">
                <button 
                    @click="isCreatePurchaseModal = true"
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 lg:px-8 lg:py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                    <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    <span>Criar Nova Compra</span>
                </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            <!-- Purchases List -->
            <div v-else class="space-y-6">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-800">
                        Compras do Grupo
                    </h3>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {{ purchases.length }} de {{ totalResult }}
                    </span>
                </div>

                <div v-if="purchases.length > 0" class="grid grid-cols-1 gap-6">
                    <div 
                        v-for="purchase in purchases" 
                        :key="purchase.id"
                        @click="openPurchase(purchase)"
                        class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                    >
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <!-- Purchase Info -->
                            <div class="flex-1 space-y-3">
                                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                                            {{ purchase.name }}
                                        </h4>
                                        <p class="text-gray-500 text-sm mt-1 line-clamp-2">{{ purchase.description }}</p>
                                    </div>
                                    <div class="flex flex-row items-center justify-between sm:justify-start sm:flex-col sm:items-end sm:ml-4 mt-2 sm:mt-0">
                                        <span 
                                            :class="[
                                                'px-3 py-1 rounded-full text-[0.750rem] sm:text-xs font-semibold',
                                                purchase.status === 'planned' || purchase.status === 'open'
                                                    ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                                                    : 'bg-green-100 text-green-800 border border-green-200'
                                            ]"
                                        >
                                            {{ purchase.status_formatted }}
                                        </span>
                                        <span class="text-gray-400 text-[0.750rem] sm:text-xs sm:mt-1">{{ convertDateFirestore(purchase.planned_date) }}</span>
                                    </div>
                                </div>

                                <!-- Price Information -->
                                <div class="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                                    <div class="flex items-center space-x-2">
                                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold">
                                            {{ purchase.price_final_formatted || 'R$ 0,00' }}
                                        </span>
                                        <span class="text-sm text-gray-600">Valor Final</span>
                                    </div>
                                    
                                    <div 
                                        v-if="calculateSavings(purchase).amount !== 0"
                                        class="flex items-center space-x-2"
                                    >
                                        <span 
                                            :class="[
                                                'px-3 py-1 rounded-lg text-sm font-semibold',
                                                calculateSavings(purchase).isPositive
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            ]"
                                        >
                                            {{ calculateSavings(purchase).formatted }}
                                        </span>
                                        <span class="text-sm text-gray-600">
                                            Valor planejado
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Arrow -->
                            <div class="flex-shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                        </svg>
                    </div>
                    <h3 class="text-gray-600 font-medium text-lg mb-2">Nenhuma compra encontrada</h3>
                    <p class="text-gray-500 mb-6">Crie a primeira compra do seu grupo</p>
                    <button 
                        @click="isCreatePurchaseModal = true"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                        Criar Primeira Compra
                    </button>
                </div>

                <!-- Pagination -->
                <div v-if="purchases.length > 0" class="flex justify-center">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <div class="flex items-center space-x-1">
                            <!-- Previous Button -->
                            <button 
                                v-if="currentPage > 1"
                                @click="changeGetPurchases(false, 1)"
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
                                <span class="text-gray-700 font-semibold">
                                    Página {{ currentPage }}
                                </span>
                            </div>

                            <!-- Next Button -->
                            <button 
                                v-if="nextPage"
                                @click="changeGetPurchases(false, 2)"
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

    <CreatePurchaseModal v-model="isCreatePurchaseModal" />
</template>
