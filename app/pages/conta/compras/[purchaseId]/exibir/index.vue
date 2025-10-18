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
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <div class="flex flex-col w-full">
                    <h2 class="text-center text-2xl font-[500]">{{ purchase.name }}</h2>
                    <h3 class="text-center text-lg font-[600]">Compra</h3>
                </div>
            </div>

            <div v-if="!loading" class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1">
                        <div class="flex flex-col">
                            <div class="flex items-center">
                                <h4 class="">Nome:</h4>
                                <span class="ml-2 font-[600]">{{ purchase.name }}</span>
                            </div>
                            <div class="flex items-center">
                                <h4 class="">Descrição:</h4>
                                <span class="ml-2 font-[600]">{{ purchase.description }}</span>
                            </div>
                            <div class="flex items-center">
                                <h4 class="">Versão:</h4>
                                <span class="ml-2 font-[600]">{{ purchase.version }}</span>
                            </div>
                            <div class="flex items-center">
                                <h4 class="">Preço total:</h4>
                                <span class="ml-2 font-[600]">{{ purchase.final_price_formatted }}</span>
                            </div>
                            <div class="flex items-center">
                                <h4 class="">Data planejada:</h4>
                                <span class="ml-2 font-[600]">{{ purchase.planned_date }}</span>
                            </div>
                            <div class="flex items-center mt-1">
                                <div :class="`${purchase.is_closed ? 'bg-green-700' : 'bg-red-700'}`" class="text-white flex items-center px-2 py-1 shadow">
                                    <span>{{ `${purchase.is_closed ? 'Já foi feita' : 'Ainda não foi feita'}` }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-1 mt-2">
                        <div class="flex items-center">
                            <NuxtLink v-if="!purchase.is_in_progress"  :to="`/conta/compras/${purchase.id}/planejar`" class="bg-gray-700 text-white px-3 py-1 rounded mr-2">Planejar</NuxtLink>
                            <NuxtLink v-else-if="!purchase.is_closed" :to="`/conta/compras/${purchase.id}/executar`" class="bg-gray-700 text-white px-3 py-1 rounded mr-2">Executar</NuxtLink>
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <h3 class="text-xl font-[600] mb-2">Produtos:</h3>
                        <template v-if="purchase.is_in_progress">
                        <div v-if="purchaseItens.length > 0" class="grid grid-cols-1 gap-4">
                            <div v-for="(item, index) in purchaseItens" :key="index" class="p-2 bg-white shadow rounded">
                                <div class="grid grid-cols-10 gap-2 items-center">
                                    <div class="col-span-10 md:col-span-7">
                                        <div class="flex flex-col">
                                            <h3 class="text-gray-500 text-sm font-semibold">Nome:</h3>
                                            <p class="text-lg font-medium">{{ item.name || '-' }}</p>
                                        </div>
                                    </div>
                                    <div class="col-span-10 md:col-span-1">
                                        <div class="flex flex-col">
                                            <h3 class="text-gray-500 text-sm font-semibold">Qtd:</h3>
                                            <p class="text-lg font-medium">{{ item.amount || '-' }}</p>
                                        </div>
                                    </div>
                                    <div class="col-span-10 md:col-span-2">
                                        <div class="flex flex-col">
                                            <h3 class="text-gray-500 text-sm font-semibold">Preço:</h3>
                                            <p class="text-lg font-medium">R$ {{ item.price || '-' }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="grid grid-cols-1">
                            <div class="col-span-1">
                                <span>Não tem nenhum item ainda</span>
                            </div>
                        </div>
                        </template>
                        <template v-else>
                            <div class="flex">
                                <span>Para visualizar os produtos, encerre a compra.</span>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

