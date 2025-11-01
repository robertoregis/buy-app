<script setup lang="ts">
    import { doc, onSnapshot, query, where, getDocs, getCountFromServer, orderBy, collection } from "firebase/firestore";
    import { useFirebase } from "../../../../../composables/useFirebase";
    import { useParams } from '../../../../../stores/params.js';
    import { useAuthentication } from '../../../../../stores/authentication.js';

    const params = useParams();

    definePageMeta({
        layout: 'dashboard'
    })
    const { firestore } = useFirebase();
    const authentication: any = useAuthentication();
    const router = useRouter()
    const route: any = useRoute()
    const purchase = ref<any>({})
    const loading = ref<boolean>(true)
    const totalResult = ref<number>(0)
    const purchaseItens = ref<any[]>([])

    const getPurchase = async () => {
        const purchaseRef = doc(firestore, "Groups", authentication.group.id, "Purchases", route.params.purchaseId);

        const unsubscribe = onSnapshot(purchaseRef, (purchaseSnap) => {
            let purchaseDoc: any = null;

            if (purchaseSnap.exists()) {
                purchaseDoc = {
                    id: purchaseSnap.id,
                    ...purchaseSnap.data()
                };
                purchase.value = purchaseDoc;
                authentication.setCodePurchase(purchase.value.code)
                getItens()
            }
        });
    }

    const getItens = async () => {
        try {
            // Query base para contagem
            const countQuery = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", route.params.purchaseId, "Models", purchase.value.purchase_final_id, "Items"))
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // Query para buscar os dados
            const q = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", route.params.purchaseId, "Models", purchase.value.purchase_final_id, "Items"),
                orderBy("created_at", "desc"),
            )

            const querySnapshot = await getDocs(q)
            purchaseItens.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            loading.value = false
        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    onBeforeMount(() => {
        params.changeRouteCurrent('purchase')
    })

    onMounted(() => {
        if(!Object.keys(authentication.group || {}).length) {
            router.push('/conta/grupos')
        } else {
            getPurchase()
        }
    })
</script>

<template>
    <main class="container mx-auto px-4 max-w-6xl">
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="text-center space-y-3">
                <div class="space-y-1">
                    <h2 class="text-3xl font-bold text-gray-800">{{ purchase.name }}</h2>
                    <h3 class="text-xl font-semibold text-blue-600">Detalhes da Compra</h3>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            <!-- Content -->
            <div v-else class="space-y-6">
                <!-- Info Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Purchase Details Card -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                            Informações da Compra
                        </h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-gray-600 font-medium">Nome:</span>
                                <span class="text-gray-800 font-semibold">{{ purchase.name || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-gray-600 font-medium">Descrição:</span>
                                <span class="text-gray-800 font-semibold text-right">{{ purchase.description || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-gray-600 font-medium">Versão:</span>
                                <span class="text-gray-800 font-semibold">{{ purchase.version || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-gray-600 font-medium">Preço Total:</span>
                                <span class="text-xl font-bold text-green-600">{{ purchase.final_price_formatted || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-gray-600 font-medium">Data Planejada:</span>
                                <span class="text-gray-800 font-semibold">{{ purchase.planned_date || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="text-gray-600 font-medium">Status:</span>
                                <span 
                                    :class="[
                                        'px-3 py-1 rounded-full text-sm font-semibold',
                                        purchase.is_closed 
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                                    ]"
                                >
                                    {{ purchase.is_closed ? '✅ Finalizada' : '🔄 Em andamento' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Card -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                            Ações
                        </h3>
                        <div class="space-y-4">
                            <div class="flex flex-col space-y-3">
                                <NuxtLink 
                                    v-if="!purchase.is_in_progress"  
                                    :to="`/conta/compras/${purchase.id}/planejar`" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-center"
                                >
                                    📝 Planejar Compra
                                </NuxtLink>
                                <NuxtLink 
                                    v-else-if="!purchase.is_closed" 
                                    :to="`/conta/compras/${purchase.id}/executar`" 
                                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-center"
                                >
                                    🛒 Executar Compra
                                </NuxtLink>
                                
                                <div v-if="purchase.is_closed" class="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p class="text-gray-600 font-medium">🎉 Compra finalizada!</p>
                                    <p class="text-sm text-gray-500 mt-1">Visualização apenas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Products Section -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold text-gray-800">Produtos</h3>
                            <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {{ totalResult }} itens
                            </div>
                        </div>

                        <template v-if="purchase.is_in_progress || purchase.is_closed">
                            <div v-if="purchaseItens.length > 0" class="space-y-4">
                                <!-- Header -->
                                <div class="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-700">
                                    <div class="col-span-8 md:col-span-7">Produto</div>
                                    <div class="col-span-2 md:col-span-1 text-center">Qtd</div>
                                    <div class="col-span-2 md:col-span-4 text-right">Preço</div>
                                </div>
                                
                                <!-- Items -->
                                <div 
                                    v-for="(item, index) in purchaseItens" 
                                    :key="index" 
                                    class="grid grid-cols-12 gap-4 px-4 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    <div class="col-span-8 md:col-span-7">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <div>
                                                <p class="font-semibold text-gray-800">{{ item.name || '—' }}</p>
                                                <p v-if="item.description" class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-span-2 md:col-span-1">
                                        <div class="text-center">
                                            <span class="font-bold text-gray-800 text-lg">{{ item.amount || '—' }}</span>
                                        </div>
                                    </div>
                                    <div class="col-span-2 md:col-span-4">
                                        <div class="text-right">
                                            <span class="font-bold text-green-600 text-lg">R$ {{ item.price || '—' }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Total -->
                                <div class="grid grid-cols-12 gap-4 px-4 py-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 font-bold text-gray-800">
                                    <div class="col-span-8 md:col-span-7 text-right">Total:</div>
                                    <div class="col-span-2 md:col-span-1 text-center">
                                        <span class="text-lg">{{ purchaseItens.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) }}</span>
                                    </div>
                                    <div class="col-span-2 md:col-span-4 text-right">
                                        <span class="text-xl text-green-600">{{ purchase.final_price_formatted || '—' }}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Empty State -->
                            <div v-else class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="text-gray-400 mb-3">
                                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
                                    </svg>
                                </div>
                                <p class="text-gray-600 font-medium text-lg">Nenhum item cadastrado</p>
                                <p class="text-gray-500 mt-2">Adicione produtos para começar a compra</p>
                            </div>
                        </template>

                        <!-- Not Started State -->
                        <template v-else>
                            <div class="text-center py-12 bg-orange-50 rounded-lg border border-orange-200">
                                <div class="text-orange-400 mb-3">
                                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                </div>
                                <p class="text-orange-800 font-medium text-lg">Compra não iniciada</p>
                                <p class="text-orange-600 mt-2">Para visualizar os produtos, inicie a compra primeiro</p>
                                <NuxtLink 
                                    :to="`/conta/compras/${purchase.id}/planejar`" 
                                    class="inline-block mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    Iniciar Planejamento
                                </NuxtLink>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>