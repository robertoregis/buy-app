<script setup lang="ts">
    import { doc, onSnapshot, collection, where, query, 
        getCountFromServer, getDocs, orderBy, limit, getDoc } from "firebase/firestore";
    import { useFirebase } from "../../../../composables/useFirebase";
    import { useParams } from '../../../../stores/params.js';
    import { useAuthentication } from '../../../../stores/authentication.js';

    const params = useParams();
    definePageMeta({
        layout: 'dashboard'
    })
    const { firestore } = useFirebase();
    const authentication: any = useAuthentication();
    const isCreateNewModal = ref<boolean>(false);
    const router = useRouter();
    const route: any = useRoute();
    const purchases = ref<any[]>([])
    const members = ref<any[]>([1, 2])
    const participants = ref<any[]>([])
    const group = ref<any>({})
    const loading = ref<boolean>(true)
    const totalResult = ref<any>(0)

    const getGroup = async () => {
        const groupRef = doc(firestore, "Groups", route.params.groupId);

        const unsubscribe = onSnapshot(groupRef, (groupSnap) => {
            let groupDoc: any = null;

            if (groupSnap.exists()) {
                groupDoc = {
                    id: groupSnap.id,
                    ...groupSnap.data()
                };
                group.value = groupDoc;
                getPurchases()
                getParticipants()
                loading.value = false
            }
        });
    }

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
                limit(3)
            )

            const querySnapshot = await getDocs(q)
            purchases.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    const getParticipants = async () => {
        try {
            loading.value = true

            // 1. Query base para contagem
            const countQuery = query(
                collection(firestore, "Groups", authentication.group.id, "Participants"),
                where("is_active", "==", true),
            )
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // 2. Query para buscar os dados dos Participantes
            const q = query(
                collection(firestore, "Groups", authentication.group.id, "Participants"),
                where("is_active", "==", true),
                orderBy("created_at", "desc"),
                limit(3)
            )

            const querySnapshot = await getDocs(q)
            
            // Mapeia os documentos dos Participantes para um array
            const participantDocs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

            // 3. Cria um array de Promises para buscar o perfil de cada usuário (coleção 'Users')
            const userDetailsPromises = participantDocs.map(async (participant: any) => {
                
                // Referência ao documento do Usuário, usando o user_id do Participante
                const userDocRef = doc(firestore, "Users", participant.user_id);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    
                    // Retorna um objeto mesclado. Os campos do 'Users' sobrescrevem os do 'Participants',
                    // garantindo que 'name' e 'email' estejam sempre atuais.
                    return {
                        id: participant.id,         // ID do documento em Participants
                        user_id: participant.user_id, // ID do usuário
                        ...participant,             // Mantém todos os campos originais do Participants
                        
                        // Campos atualizados da coleção Users
                        name: userData.name,
                        email: userData.email,
                        image_url: userData.image_url || null // '|| null' é uma segurança caso a imagem não exista
                    };
                } else {
                    // Caso o documento em Users tenha sido deletado ou não exista
                    return {
                        id: participant.id,
                        user_id: participant.user_id,
                        ...participant,
                        name: participant.name + " (Usuário não encontrado)",
                        email: 'N/A',
                        image_url: null
                    };
                }
            });

            // 4. Espera todas as Promises terminarem para ter a lista final de participantes
            participants.value = await Promise.all(userDetailsPromises);

        } catch (error) {
            console.error("Erro ao buscar participantes e usuários:", error)
        } finally {
            loading.value = false
        }
    }

    const convertePrice = (planned: number, final: number) => {
        const price = Number(planned) - Number(final);
        return `R$ ${price.toFixed(2).replace(".", ",")}`
    }

    onBeforeMount(() => {
        params.changeRouteCurrent('group')
    })

    onMounted(() => {
        if(!Object.keys(authentication.group || {}).length) {
            router.push('/conta/grupos')
        } else {
            getGroup()
        }
    })
</script>

<template>
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <h2 class="text-center text-2xl font-[600]">Grupo</h2>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">

                    <div class="col-span-1">
                        <div class="flex flex-col bg-gray-200 rounded">
                            <div class="flex bg-gray-600 rounded p-2 text-white">
                                <h1 class="font-[600] text-xl">{{ authentication.group.name }}</h1>
                            </div>
                            <p class="p-2">{{ authentication.group.description }}</p>
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="grid grid-cols-1">
                            <div class="col-span-1">
                                <h2 class="font-[600] text-lg mb-0">Últimas compras</h2>
                            </div>
                            <div v-if="purchases.length > 0" class="col-span-1 mt-2">
                                <div class="grid grid-cols-1 gap-2">
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
                                                    <span class="bg-red-600 text-white text-[0.8rem]" style="padding: 1px 10px;">{{ convertePrice(purchase.price_planned, purchase.price_final) }}</span>
                                                </div>
                                            </div>
                                        </NuxtLink>
                                    </template>
                                </div>
                            </div>
                            <div class="col-span-1" :class="`${purchases.length > 0 ? 'mt-4' : 'mt-2'}`">
                                <div class="flex items-center">
                                    <Button @click="isCreateNewModal = true" label="Criar compra" color="bg-green-700 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-1 mt-6">
                        <div class="grid grid-cols-1">
                            <div class="col-span-1">
                                <h2 class="font-[600] text-lg">Participantes:</h2>
                            </div>
                            <div v-if="participants.length > 0" class="col-span-1 mt-2">
                                <div class="grid grid-cols-1 gap-2">
                                    <template v-for="participant in participants" :key="participant.id">
                                        <NuxtLink :to="`/conta/compras/${participant.id}`" class="cursor-pointer col-span-1 p-2 shadow bg-gray-200 rounded">
                                            <div class="flex items-center mt-1">
                                                <div class="w-[42px] h-[42px] rounded-full shadow-lg border-1 p-1 border-black/10 overflow-hidden">
                                                    <img :src="participant.image_url" alt="">
                                                </div>
                                                <span class="ml-3">{{ participant.name }}</span>
                                            </div>
                                        </NuxtLink>
                                    </template>
                                </div>
                            </div>
                            <div class="col-span-1" :class="`${participants.length > 0 ? 'mt-4' : 'mt-2'}`">
                                <div class="flex items-center">
                                    <Button label="Adicionar participante" color="bg-green-700 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </main>
    <CreateNewModal v-model="isCreateNewModal" />
</template>
