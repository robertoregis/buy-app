<script setup lang="ts">
    import { useParams } from '../../../../../stores/params.js';
    import { useAuthentication } from '../../../../../stores/authentication.js';
    import { doc, onSnapshot, getDoc, query,
        orderBy, getDocs, getCountFromServer,
        collection, updateDoc, serverTimestamp
    } from "firebase/firestore";
    import { useFirebase } from "../../../../../composables/useFirebase";
    import { saveItem, deleteItem, plannedPurchase, updatePurchaseMemberInOnline } from '../../../../../composables/firebaseDocs.js';

    const params = useParams();

    definePageMeta({
        layout: 'dashboard'
    })

    const authentication: any = useAuthentication();
    const { firestore } = useFirebase();
    const router = useRouter()
    const route: any = useRoute()
    const purchase = ref<any>({})
    const loading = ref<boolean>(true)
    const totalResult = ref<number>(0)
    const purchaseItens = ref<any[]>([])
    const itensDeleted = ref<any[]>([])
    const myInterval = ref<any>(null)
    const groupId = ref<any>(null)

    const unsubscribeSnapshot = ref<any>(null);

    // Adicione esta linha junto com as outras declarações de ref (purchase, loading, etc.)
    const membersData = ref<any>({})

    // O formdata agora é um array de objetos
    const formdata = ref<any[]>([
      {
        name: null,
        amount: null,
        price: null
      }
    ])

    // Função para adicionar um novo item (objeto) ao array
    const addNewItem = () => {
        formdata.value.push({
            name: null,
            amount: null,
            price: null
        })
    }

    // Função para remover um item do array com base no índice
    const removeItem = (index: number, item: any) => {
        if(item.id) {
            itensDeleted.value.push(item.id)
        }
        formdata.value.splice(index, 1);
    }

    // Função para tratar o valor do preço (substituir vírgula por ponto)
    const formatPrice = (event: any, index: number) => {
      let value = event.target.value;
      value = value.replace(',', '.');
      formdata.value[index].price = value;
    }

    const parseNumber = (value: any) => {
        if (value === null || value === undefined || value === "") return 0;
        // remove tudo que não seja dígito, ponto ou vírgula (ex.: "R$ 12,34" -> "12,34")
        const cleaned = String(value).replace(/[^\d.,-]/g, "").trim();
        if (!cleaned) return 0;
        // se tiver vírgula e ponto, assume que ponto é separador de milhares -> remove pontos
        const hasComma = cleaned.indexOf(",") !== -1;
        const hasDot = cleaned.indexOf(".") !== -1;
        let normalized = cleaned;
        if (hasComma && hasDot) {
            // ex: "1.234,56" -> "1234,56"
            normalized = cleaned.replace(/\./g, "");
        }
        // troca vírgula por ponto para parseFloat
        normalized = normalized.replace(",", ".");
        const n = parseFloat(normalized);
        return Number.isFinite(n) ? n : 0;
        };

        const totalAmount = computed(() => {
        return formdata.value.reduce((total, item) => {
            const q = parseNumber(item.amount);
            return total + q;
        }, 0);
        });

        const totalPrice = computed(() => {
        return formdata.value.reduce((total, item) => {
            const price = parseNumber(item.price);
            const amount = parseNumber(item.amount);
            return total + price * amount;
        }, 0);
        });

        // opcional: formato pronto para exibir
        const totalPriceFormatted = computed(() => {
        return `R$ ${totalPrice.value.toFixed(2).replace(".", ",")}`;
        });

    const getPurchase = async () => {
        const purchaseRef = doc(firestore, "Groups", authentication.group.id, "Purchases", route.params.purchaseId);

        // Torne o callback assíncrono para usar await
        unsubscribeSnapshot.value = onSnapshot(purchaseRef, async (purchaseSnap) => {
            let purchaseDoc: any = null;

            if (purchaseSnap.exists()) {
                purchaseDoc = {
                    id: purchaseSnap.id,
                    ...purchaseSnap.data()
                };
                purchase.value = purchaseDoc;
                authentication.setCodePurchase(purchase.value.code)

                // --------------------------------------------------------------------
                // 🎯 NOVO CÓDIGO: Buscar Nome dos Membros Ativos
                // --------------------------------------------------------------------
                
                const activityMap = purchaseDoc.members_activity || {};
                const activeUserIds = Object.keys(activityMap);
                
                // Identificar IDs a buscar:
                // 1. Não é o usuário atual (`authentication.userId`).
                // 2. Não está nos dados que já buscamos (`membersData.value[userId]`).
                const idsToFetch = activeUserIds
                    .filter(userId => userId !== authentication.userId)
                    .filter(userId => !membersData.value[userId]);

                if (idsToFetch.length > 0) {
                    // Criar promessas para buscar os documentos na coleção "Users" (global)
                    const fetchPromises = idsToFetch.map(userId => 
                        getDoc(doc(firestore, "Users", userId))
                    );

                    const snaps = await Promise.all(fetchPromises);
                    
                    const newMembersData: any = { ...membersData.value };

                    snaps.forEach(snap => {
                        if (snap.exists()) {
                            const data = snap.data();
                            newMembersData[snap.id] = {
                                // Assumindo que os campos no seu documento User são 'name' e 'image_url'
                                name: data.name, 
                                image_url: data.image_url 
                            };
                        }
                    });
                    
                    // Atualizar a ref reativa
                    membersData.value = newMembersData;
                }

                if(!purchase.value.planning_lock_userId) {
                    membersInOnline()
                }
                
                // --------------------------------------------------------------------

                if(purchase.value.is_execute) {
                    router.push(`/conta/compras/${purchase.value.id}/executar`)
                } else {
                    getItens()
                }
            }
        });
    }

    const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

    const formatActivityTime = (timestamp: any): string => {
        if (!timestamp || typeof timestamp.toDate !== 'function') return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const isUserOnline = (activityTimestamp: any): boolean => {
        if (!activityTimestamp || typeof activityTimestamp.toMillis !== 'function') return false;
        const lastSeenMs = activityTimestamp.toMillis();
        const currentMs = Date.now();
        return (currentMs - lastSeenMs) < ACTIVE_WINDOW_MS;
    };

    const onlineMembersList = computed(() => {
        // 1. Inicia o mapa de atividades do purchase
        const activityMap = purchase.value.members_activity || {};
        const list = [];
        
        // 2. Itera sobre a atividade e filtra apenas os ONLINE
        for (const userId in activityMap) {
            if (!Object.prototype.hasOwnProperty.call(activityMap, userId)) continue;

            const lastSeenTimestamp = activityMap[userId];
            
            // Mantém sua lógica de filtro por tempo (ACTIVE_WINDOW_MS)
            if (isUserOnline(lastSeenTimestamp)) { 
                
                let name = 'Buscando...'; // Default, caso o fetch ainda não tenha voltado
                let image_url = '';
                
                // 3. Obtém Nome e Imagem
                if (userId === authentication.userId) {
                    // Usuário Logado: Dados da Store
                    name = authentication.user.name || 'Você';
                    image_url = authentication.user.image_url || '';
                    
                } else if (membersData.value[userId]) {
                    // Outro Membro no Cache: Dados do Cache
                    name = membersData.value[userId].name;
                    image_url = membersData.value[userId].image_url;
                } 
                
                list.push({
                    userId: userId,
                    name: name,
                    image_url: image_url,
                    lastSeenTimestamp: lastSeenTimestamp,
                    lastSeenFormatted: formatActivityTime(lastSeenTimestamp),
                });
            }
        }
        
        // 4. Opcional: Ordenar a lista (coloca o usuário logado primeiro)
        list.sort((a, b) => {
            if (a.userId === authentication.userId) return -1;
            if (b.userId === authentication.userId) return 1;
            // Ordena por último visto, do mais recente para o mais antigo
            return b.lastSeenTimestamp.toMillis() - a.lastSeenTimestamp.toMillis();
        });

        return list;
    });

    const getItens = async () => {
        try {
            // Query base para contagem
            const countQuery = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", route.params.purchaseId, "Models", purchase.value.purchase_planned_id, "Items"))
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // Query para buscar os dados
            const q = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", route.params.purchaseId, "Models", purchase.value.purchase_planned_id, "Items"),
                orderBy("created_at", "desc"),
            )

            const querySnapshot = await getDocs(q)
            if(querySnapshot.docs.length > 0) {
                formdata.value = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
            }
            loading.value = false
        } catch (error) {
            console.error(error)
        } finally {
            loading.value = false
        }
    }

    const deleteItems = async () => {
        try {
            // cria um array de promessas (uma para cada item)
            const promises = itensDeleted.value.map(async (item) => {
                await deleteItem(authentication.group.id, purchase.value.id, purchase.value.purchase_planned_id, item);
            });

            // espera todas as criações terminarem
            await Promise.all(promises);

            alert("Itens deletados com sucesso!");
        } catch (error) {
            console.error("Erro ao deletar itens:", error);
            alert("Erro ao deletar itens.");
        }
    }

    const send = async () => {
        if (!formdata.value.length) {
            alert("Adicione pelo menos um item");
            return;
        }

        try {
            if(itensDeleted.value.length > 0) {
                deleteItems()
            }
            // cria um array de promessas (uma para cada item)
            const promises = formdata.value.map(async (item) => {
                const formattedItem = {
                    id: item.id ?? null,
                    name: item.name?.trim(),
                    amount: Number(item.amount) || 0,
                    price: parseFloat(String(item.price).replace(",", ".")) || 0,
                    created_by: authentication.user.id,
                };

                await saveItem(authentication.group.id, purchase.value.id, purchase.value.purchase_planned_id, formattedItem);
            });

            // espera todas as criações terminarem
            await Promise.all(promises);
            try {
                await plannedPurchase(
                    authentication.group.id, 
                    purchase.value.id,
                    purchase.value.purchase_planned_id,
                    Number(totalAmount.value) || 0,
                    parseFloat(String(totalPrice.value).replace(",", ".")) || 0,
                    purchase.value.purchase_geral_id
                ).
                    then(() => {
                        router.push(`/conta/compras/${purchase.value.id}/exibir`)
                    })
            } catch(error) {
                console.log(error)
            }

            alert("Compra planejada com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar itens:", error);
            alert("Erro ao salvar itens.");
        }
    };

    // Computado para determinar o usuário que tem o lock ATUALMENTE
    const currentPlanner = computed(() => {
        const lockUserId = purchase.value.planning_lock_userId;
        const lockExpires = purchase.value.planning_lock_expires;
        if (!lockUserId || !lockExpires) {
            return { isLocked: false, userId: null };
        }
        // 1. Checa se o lock expirou
        const isExpired = lockExpires.toDate() < new Date();
        
        if (isExpired) {
            // Se expirou, o lock está virtualmente livre
            return { isLocked: false, userId: null };
        }
        
        // 2. Se não expirou, há um dono
        return { 
            isLocked: true, 
            userId: lockUserId 
        };
    });

    // Computado para saber se EU posso editar
    const canUserEdit = computed(() => {
        const planner = currentPlanner.value;
        return !planner.isLocked || planner.userId === authentication.userId;
    });

    // Adicione este computed property logo após o 'canUserEdit'
    // Retorna o nome do usuário que detém o lock, ou null se estiver livre
    const currentPlannerName = computed(() => {
        const planner = currentPlanner.value;
        
        if (!planner.isLocked) {
            return null; // Ninguém está editando
        }
        
        // Se sou eu que tenho o lock
        if (planner.userId === authentication.userId) {
            // Assumindo que o nome do usuário atual está em authentication.user.name
            return authentication.user.name || 'Você (Dono do Lock)'; 
        }
        
        // Se é outro membro, tentar buscar nos dados que salvamos
        const member = membersData.value[planner.userId];
        if (member && member.name) {
            return member.name;
        }
        
        // Fallback se ainda estiver buscando ou se não encontrou
        return planner.userId;
    });

    const membersInOnline = async () => {
        const docRef = doc(firestore, "Groups", authentication.group.id, "Purchases", purchase.value.id);
        const currentUserId = authentication.userId;
        
        const newExpiration = new Date(Date.now() + 420000); // 7 minutos

        const pingData = {
            [`members_activity.${currentUserId}`]: serverTimestamp(), 
        };
        
        await updateDoc(docRef, pingData);

        const currentPurchase = purchase.value;
        const lockUserId = currentPurchase.planning_lock_userId;
        const lockExpires = currentPurchase.planning_lock_expires;
        const isLockExpired = lockExpires && lockExpires.toDate() < new Date();
        const isLockFree = !lockUserId;
        const iOwnLock = lockUserId === currentUserId;

        if (iOwnLock || isLockFree || isLockExpired) {
            await updateDoc(docRef, {
                planning_lock_userId: currentUserId,
                planning_lock_expires: newExpiration
            });
            console.log(`Lock renovado por: ${currentUserId}`);
        } else {
            console.log(`Lock negado. Dono atual: ${lockUserId}`);
        }
    }

    onBeforeMount(() => {
        params.changeRouteCurrent('purchase')
    })

    onMounted(() => {
        groupId.value = authentication.group.id
        if(!Object.keys(authentication.group || {}).length) {
            router.push('/conta/grupos')
        } else {
            getPurchase()
            setTimeout(() => {
                membersInOnline()
            }, 2000)
            myInterval.value = setInterval(() => {
                membersInOnline()
            }, 120000)
        }
    })

    onBeforeUnmount(() => {
        if (unsubscribeSnapshot.value) {
            unsubscribeSnapshot.value();
            console.log('onSnapshot desinscrito.');
        }
        clearInterval(myInterval.value)

        const docRef = doc(firestore, "Groups", groupId.value, "Purchases", purchase.value.id);

        if (currentPlanner.value.userId === authentication.userId) {
            updateDoc(docRef, {
                planning_lock_userId: null,
                planning_lock_expires: null
            }).catch(e => console.error("Falha ao liberar o lock: ", e));
        }
    })
</script>

<template>
    <main class="container mx-auto px-4 max-w-4xl">
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="text-center space-y-3">
                <div class="space-y-1">
                    <h2 class="text-3xl font-bold text-gray-800">Planejamento</h2>
                    <h3 class="text-xl font-semibold text-green-600">Compra</h3>
                </div>
                <p class="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Faça o planejamento da sua compra até antes do momento da sua execução.
                </p>
            </div>

            <!-- Online Members -->
            <div v-if="onlineMembersList.length > 0" class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-sm font-semibold text-gray-700">
                            Online ({{ onlineMembersList.length }})
                        </span>
                        <div class="flex -space-x-2">
                            <div v-for="member in onlineMembersList" :key="member.userId">
                                <div 
                                    v-tippy="{ content: member.name + (member.userId === authentication.userId ? ' (Você)' : '') }"
                                    class="relative"
                                >
                                    <img
                                        :src="member.image_url || 'https://firebasestorage.googleapis.com/v0/b/buy-app-8c9ec.firebasestorage.app/o/avatar.png?alt=media&token=ae2cef95-b633-491a-9394-4723e541e8e2'" 
                                        :alt="member.name"
                                        class="w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110"
                                        :class="[
                                            member.userId === authentication.userId 
                                                ? 'border-green-500 ring-2 ring-green-300 z-10 shadow-md' 
                                                : 'border-white hover:border-blue-400 shadow-sm' 
                                        ]"
                                        loading="lazy"
                                    />
                                    <span 
                                        v-if="currentPlanner.isLocked && currentPlanner.userId === member.userId"
                                        class="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-yellow-500 shadow-sm"
                                        v-tippy="{ content: 'Editando agora' }"
                                    ></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lock Warning -->
            <div v-if="currentPlanner.isLocked && currentPlanner.userId !== authentication.userId" 
                 class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-sm">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-yellow-800">Outra pessoa está editando</p>
                        <p class="text-sm text-yellow-700 mt-1">
                            O usuário <strong>{{ currentPlannerName }}</strong> está com o controle da edição no momento.
                        </p>
                        <p class="text-xs text-yellow-600 mt-1">
                            Você poderá editar quando o controle for liberado (expira automaticamente em 7 minutos).
                        </p>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-center space-x-4">
                <NuxtLink 
                    v-if="purchase.is_execute" 
                    :to="`/conta/compras/${route.params.purchaseId}/exibir`" 
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                    Exibir Compra
                </NuxtLink>
                <NuxtLink 
                    v-if="!purchase.is_execute && canUserEdit" 
                    :to="`/conta/compras/${route.params.purchaseId}/executar`" 
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                    Executar Compra
                </NuxtLink>
            </div>

            <!-- Totals Card -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Resumo dos Totais</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p class="text-sm font-medium text-gray-600">Quantidade Total</p>
                        <p class="text-2xl font-bold text-gray-800 mt-1">{{ totalAmount }}</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p class="text-sm font-medium text-gray-600">Valor Total</p>
                        <p class="text-2xl font-bold text-green-600 mt-1">R$ {{ totalPrice.toFixed(2) }}</p>
                    </div>
                </div>
            </div>

            <!-- Items Form -->
            <div v-if="canUserEdit" class="space-y-4">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Itens da Compra</h3>
                        
                        <div class="space-y-4">
                            <div v-for="(item, index) in formdata" :key="index" 
                                 class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 relative group">
                                <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                    <!-- Item Name -->
                                    <div class="lg:col-span-7">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Nome do Item</label>
                                        <input 
                                            v-model="item.name" 
                                            type="text" 
                                            placeholder="Digite o nome do item..."
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                        >
                                    </div>
                                    
                                    <!-- Quantity and Price -->
                                    <div class="lg:col-span-5">
                                        <div class="grid grid-cols-2 gap-3">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                                                <input 
                                                    v-model="item.amount" 
                                                    type="number" 
                                                    placeholder="0"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white text-center"
                                                >
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Preço (R$)</label>
                                                <div class="relative">
                                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">R$</span>
                                                    <input
                                                        v-model="item.price"
                                                        type="text"
                                                        placeholder="0,00"
                                                        class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                                        @input="formatPrice($event, index)"
                                                    >
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Delete Button -->
                                <div v-if="!purchase.is_execute && !purchase.is_in_progress" 
                                     class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button 
                                        @click.prevent="removeItem(index, item)" 
                                        class="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM4.5 4h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM11 2H5v1h6V2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div v-if="!purchase.is_execute && !purchase.is_in_progress" class="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                            <button 
                                @click.prevent="addNewItem" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span>Adicionar Item</span>
                            </button>
                            <button 
                                @click="send" 
                                class="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span>Salvar Planejamento</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>