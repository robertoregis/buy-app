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
    type MemberActivity = { id: string, activity: any };

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

        const unsubscribe = onSnapshot(purchaseRef, (purchaseSnap) => {
            let purchaseDoc: any = null;

            if (purchaseSnap.exists()) {
                purchaseDoc = {
                    id: purchaseSnap.id,
                    ...purchaseSnap.data()
                };
                purchase.value = purchaseDoc;
                authentication.setCodePurchase(purchase.value.code)
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

    // --- COMPUTED PROPERTY (A SOLUÇÃO) ---
    const activeMembersList = computed(() => {
        const activityMap = purchase.value.members_activity || {};
        const activeMembers: { userId: string, lastSeenTimestamp: any, lastSeenFormatted: string }[] = [];

        for (const userId in activityMap) {
            if (Object.prototype.hasOwnProperty.call(activityMap, userId)) {
                const timestamp = activityMap[userId];
                
                if (isUserOnline(timestamp)) {
                    activeMembers.push({
                        userId: userId,
                        lastSeenTimestamp: timestamp,
                        lastSeenFormatted: formatActivityTime(timestamp)
                    });
                }
            }
        }

        return activeMembers;
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
            // NENHUMA AÇÃO NO FIREBASE DEVE SER FEITA AQUI. A próxima pessoa que der PING vai limpá-lo.
            return { isLocked: false, userId: null };
        }
        
        // 2. Se não expirou, há um dono
        return { 
            isLocked: true, 
            userId: lockUserId 
            // Você pode adicionar a data formatada de expiração aqui se quiser
        };
    });

    // Computado para saber se EU posso editar
    const canUserEdit = computed(() => {
        const planner = currentPlanner.value;
        
        // Posso editar se: 
        // 1. O lock está livre (minha próxima chamada ao membersInOnline vai pegar)
        // 2. Eu sou o dono do lock
        return !planner.isLocked || planner.userId === authentication.userId;
    });

    // NOVO: Função para obter ou renovar o lock e enviar o ping
    const membersInOnline = async () => {
        const docRef = doc(firestore, "Groups", authentication.group.id, "Purchases", purchase.value.id);
        const currentUserId = authentication.userId;
        
        // A cada 2 minutos, o lock se renovará por 2 minutos e 10 segundos (para dar uma margem)
        const newExpiration = new Date(Date.now() + 130000); // 120s (intervalo) + 10s (margem)

        // 1. Ping de Atividade (sempre faça)
        const pingData = {
            [`members_activity.${currentUserId}`]: serverTimestamp(), 
        };
        
        // 2. Tentar Adquirir/Renovar o Lock (apenas se for você ou se estiver livre/expirado)
        // Para simplificar no cliente, faremos 3 updates em sequência:
        
        // A) Envia o Ping de Atividade
        await updateDoc(docRef, pingData);

        // B) Tenta adquirir o lock se for o primeiro
        const currentPurchase = purchase.value;
        const lockUserId = currentPurchase.planning_lock_userId;
        const lockExpires = currentPurchase.planning_lock_expires;

        // Verificação de Lock Expirado (ou se sou o atual dono)
        const isLockExpired = lockExpires && lockExpires.toDate() < new Date();
        const isLockFree = !lockUserId;
        const iOwnLock = lockUserId === currentUserId;

        if (iOwnLock || isLockFree || isLockExpired) {
            // Se eu já sou o dono, ou se está livre, ou se expirou, eu tomo/renovo o lock
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
        clearInterval(myInterval.value)

        const docRef = doc(firestore, "Groups", authentication.group.id, "Purchases", purchase.value.id);

        if (currentPlanner.value.userId === authentication.userId) {
            // Limpa o lock explicitamente para liberar para o próximo mais rápido
            updateDoc(docRef, {
                planning_lock_userId: null,
                planning_lock_expires: null
            }).catch(e => console.error("Falha ao liberar o lock: ", e));
        }
    })
</script>

<template>
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <div class="flex flex-col w-full">
                    <h2 class="text-center text-2xl font-[500]">Planejamento</h2>
                    <h3 class="text-center text-lg font-[600]">Compra</h3>
                </div>
                <p class="mt-2">Faça o planejamento da sua compra até antes do momento da sua compra.</p>
            </div>
            {{ purchase }}
            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1">
                        <div class="flex justify-center items-center">
                            <NuxtLink v-if="purchase.is_execute" :to="`/conta/compras/${route.params.purchaseId}/exibir`" class="bg-green-700 text-white px-5 py-1 rounded mr-3">Exibir</NuxtLink>
                            <NuxtLink v-if="!purchase.is_execute && canUserEdit" :to="`/conta/compras/${route.params.purchaseId}/executar`" class="bg-green-700 text-white px-5 py-1 rounded">Executar</NuxtLink>
                        </div>
                    </div>
                    <div v-if="currentPlanner.isLocked && currentPlanner.userId !== authentication.userId" class="col-span-1 mt-3">
                        <div class="flex flex-col p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
                            <span class="font-[600]">⚠️ Outra pessoa já está planejando.</span>
                            <span class="text-sm mt-1">O usuário **{{ currentPlanner.userId }}** está com o controle da edição.</span>
                            <span class="text-xs mt-1">Você poderá editar quando o controle for liberado (expiração automática em 2m10s).</span>
                        </div>
                    </div>
                    <div class="col-span-1 mt-6 p-4 bg-gray-100 rounded shadow">
                        <h3 class="text-xl font-bold">Totais</h3>
                        <div class="mt-2 flex justify-between">
                            <p class="text-lg font-medium">Quantidade Total:</p>
                            <p class="text-lg font-bold">{{ totalAmount }}</p>
                        </div>
                        <div class="flex justify-between">
                            <p class="text-lg font-medium">Valor Total:</p>
                            <p class="text-lg font-bold">R$ {{ totalPrice.toFixed(2) }}</p>
                        </div>
                    </div>
                    <div v-if="canUserEdit" class="col-span-1 mt-1">
                        <form action="" class="grid grid-cols-1 gap-4">
                            <div v-for="(item, index) in formdata" :key="index" class="p-2 bg-white shadow rounded relative">
                                <div class="grid grid-cols-1 md:grid-cols-10 gap-2 md:gap-4 items-center">
                                    <div class="col-span-1 md:col-span-7">
                                        <div class="flex flex-col relative">
                                            <label v-if="item.name" class="absolute top-[-11px] left-[5px] text-gray-500" style="z-index: 100;">Título:</label>
                                            <input v-model="item.name" type="text" placeholder="Título" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-10 gap-2 col-span-1 md:col-span-3">
                                        <div class="col-span-4 md:col-span-3">
                                            <div class="flex flex-col relative">
                                                <label v-if="item.amount" class="absolute top-[-11px] left-[5px] text-gray-500" style="z-index: 100;">Quantidade:</label>
                                                <input v-model="item.amount" type="number" placeholder="Qtd." class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                                            </div>
                                        </div>
                                        <div class="col-span-6 md:col-span-7">
                                            <div class="flex flex-col relative">
                                                <label v-if="item.price" class="absolute top-[-11px] left-[5px] text-gray-500" style="z-index: 100;">Preço:</label>
                                                <div class="flex items-center mt-1 border-2 border-gray-200 rounded bg-gray-200 pl-2 pr-1">
                                                    <span class="text-gray-500 font-semibold mr-1">R$</span>
                                                    <input
                                                        v-model="item.price"
                                                        type="text"
                                                        placeholder="Preço"
                                                        class="w-full bg-gray-200 py-1 focus:outline-none"
                                                        @input="formatPrice($event, index)"
                                                    >
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="!purchase.is_execute && !purchase.is_in_progress" class="absolute top-[-5px] right-[-5px]">
                                    <button @click.prevent="removeItem(index, item)" class="bg-red-500 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM4.5 4h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM11 2H5v1h6V2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div v-if="!purchase.is_execute && !purchase.is_in_progress && canUserEdit" class="col-span-1 mt-4">
                                <div class="flex items-center justify-between">
                                    <Button @click.prevent="addNewItem" label="Adicionar novo item" color="bg-blue-500" />
                                    <Button @click="send" label="Salvar" color="bg-green-700" />
                                </div>
                            </div>
                        </form>
                    
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>