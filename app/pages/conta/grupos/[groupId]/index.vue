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
    const isAddParticipant = ref<boolean>(false);
    const router = useRouter();
    const route: any = useRoute();
    const purchases = ref<any[]>([])
    const members = ref<any[]>([1, 2])
    const participants = ref<any[]>([])
    const group = ref<any>({})
    const loading = ref<boolean>(true)
    const totalResult = ref<any>(0)

    const participantSelected = ref<any>({});
    const isShowParticipant = ref<boolean>(false);

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

    const showParticipant = (participant: any) => {
        participantSelected.value = {}
        participantSelected.value = participant
        isShowParticipant.value = true
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
    <main class="container mx-auto px-4 max-w-6xl">
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center space-y-3">
                <h2 class="text-3xl font-bold text-gray-800">Detalhes do Grupo</h2>
                <p class="text-gray-600">Gerencie compras e participantes do seu grupo</p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            <!-- Content -->
            <div v-else class="space-y-8">
                <!-- Group Info Card -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div class="flex-1">
                            <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ authentication.group.name }}</h1>
                            <p class="text-gray-600 text-lg leading-relaxed">{{ authentication.group.description }}</p>
                        </div>
                        <div class="md:flex-shrink-0 md:ml-6 mt-2 md:mt-0">
                            <div class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                                👑 Dono do Grupo
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Two Column Layout -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Recent Purchases -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold text-gray-800">Últimas Compras</h3>
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {{ purchases.length }} de {{ totalResult }}
                            </span>
                        </div>

                        <div v-if="purchases.length > 0" class="space-y-4">
                            <NuxtLink 
                                v-for="purchase in purchases" 
                                :key="purchase.id" 
                                :to="`/conta/compras/${purchase.id}/exibir`" 
                                class="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
                            >
                                <div class="space-y-3">
                                    <!-- Header -->
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
                                                    purchase.status === 'planned' 
                                                        ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                                                        : 'bg-green-100 text-green-800 border border-green-200'
                                                ]"
                                            >
                                                {{ purchase.status_formatted }}
                                            </span>
                                            <span class="text-gray-400 text-[0.750rem] sm:text-xs sm:mt-1">{{ purchase.planned_date }}</span>
                                        </div>
                                    </div>

                                    <!-- Price Info -->
                                    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <div class="flex space-x-2">
                                            <span class="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold">
                                                {{ purchase.final_price_formatted }}
                                            </span>
                                            <span class="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-semibold">
                                                {{ convertePrice(purchase.price_planned, purchase.price_final) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </NuxtLink>
                        </div>

                        <!-- Empty Purchases State -->
                        <div v-else class="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                            <div class="text-gray-400 mb-3">
                                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
                                </svg>
                            </div>
                            <p class="text-gray-600 font-medium">Nenhuma compra encontrada</p>
                            <p class="text-gray-500 text-sm mt-1">Crie a primeira compra do grupo</p>
                        </div>

                        <!-- Create Purchase Button -->
                        <button 
                            @click="isCreateNewModal = true"
                            class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>Criar Nova Compra</span>
                        </button>
                    </div>

                    <!-- Participants -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold text-gray-800">Participantes</h3>
                            <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {{ participants.length }} membros
                            </span>
                        </div>

                        <div v-if="participants.length > 0" class="space-y-3">
                            <div 
                                v-for="participant in participants" 
                                :key="participant.id"
                                @click="showParticipant(participant)"
                                class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer group"
                            >
                                <div class="flex items-center space-x-4">
                                    <!-- Avatar -->
                                    <div class="flex-shrink-0">
                                        <div class="relative">
                                            <img 
                                                :src="participant.image_url || 'https://firebasestorage.googleapis.com/v0/b/buy-app-8c9ec.firebasestorage.app/o/avatar.png?alt=media&token=ae2cef95-b633-491a-9394-4723e541e8e2'" 
                                                :alt="participant.name"
                                                class="w-12 h-12 rounded-full border-2 border-white shadow-sm group-hover:border-purple-200 transition-colors"
                                            />
                                            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- Info -->
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                                            {{ participant.name }}
                                        </h4>
                                        <p class="text-gray-500 text-sm truncate">{{ participant.email }}</p>
                                    </div>
                                    
                                    <!-- Indicator -->
                                    <div class="flex-shrink-0">
                                        <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty Participants State -->
                        <div v-else class="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                            <div class="text-gray-400 mb-3">
                                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                </svg>
                            </div>
                            <p class="text-gray-600 font-medium">Nenhum participante</p>
                            <p class="text-gray-500 text-sm mt-1">Adicione membros ao grupo</p>
                        </div>

                        <!-- Add Participant Button (Only for Owner) -->
                        <button 
                            v-if="group.owner_id === authentication.userId"
                            @click="isAddParticipant = true"
                            class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                            </svg>
                            <span>Adicionar Participante</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modals (Keep exactly as they are) -->
    <CreateNewModal v-model="isCreateNewModal" />
    <AddParticipant v-model="isAddParticipant" :participants="participants" type="group" @added="getGroup" />
    <Participant v-model="isShowParticipant" :participant="participantSelected" />
</template>
