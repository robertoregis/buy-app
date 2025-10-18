<script setup lang="ts">
    import { collection, getDocs, query, where,
        getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
        limit,startAt, limitToLast, endAt
    } from 'firebase/firestore';
    import { useFirebase } from '../../../composables/useFirebase';
    import { useParams } from '../../../stores/params.js';
    import { useAuthentication } from '../../../stores/authentication.js';

    const params = useParams();
    definePageMeta({
        layout: 'dashboard'
    })
    const { firestore } = useFirebase();
    const router = useRouter();
    const authentication: any = useAuthentication();
    const isCreateNewModal = ref<boolean>(false)
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

            // Query base para contagem
            const countQuery = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases"),
                where("is_active", "==", true),
            )
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // Query para buscar os dados
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
            purchases.value.pop() // remove o 13º
            } else {
            nextPage.value = false
            }

            console.log(purchases.value)
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
        if(purchase.is_execute) {
            router.push(`/conta/compras/${purchase.id}/executar`)
        } else {
            router.push(`/conta/compras/${purchase.id}/planejar`)
        }
    }

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
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <h2 class="text-center text-2xl font-[600]">Compras</h2>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1">
                        <div class="flex justify-center items-center">
                            <Button @click="isCreateNewModal = true" label="Criar compra" color="bg-green-700 text-white" />
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="grid grid-cols-1 gap-4">
                            <template v-for="purchase in purchases" :key="purchase.id">
                                <NuxtLink :to="`/conta/compras/${purchase.id}/exibir`" class="col-span-1 p-2 shadow bg-gray-200 rounded">
                                    <div class="flex flex-col">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm mb-1 font-[600]">{{ purchase.name }}</span>
                                            <div class="flex flex-row items-center">
                                                <span class="bg-gray-500 text-white text-[0.8rem] mr-3 py-1 px-3">{{ purchase.status === 'planned' ? 'Em planejamento' : 'Executada' }}</span>
                                                <span class="text-[0.8rem] font-[600]">10h20 19/09/2025 (data)</span>
                                            </div>
                                        </div>
                                        <p class="text-sm mb-1">{{ purchase.description }}</p>
                                        <div class="flex">
                                            <span class="bg-gray-500 text-white text-[0.8rem] mr-3" style="padding: 1px 10px;">{{ purchase.final_price_formatted }}</span>
                                            <span class="bg-red-600 text-white text-[0.8rem]" style="padding: 1px 10px;">R$ {{ purchase.price_planned - purchase.price_final }}</span>
                                        </div>
                                    </div>
                                </NuxtLink>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <CreateNewModal v-model="isCreateNewModal" />
</template>
