<script setup lang="ts">
    import { useParams } from '../../../../../stores/params.js';
    import { useAuthentication } from '../../../../../stores/authentication.js';
    // Importações atualizadas: onSnapshot para real-time. Removi getDocs/getCountFromServer aqui
    import { doc, onSnapshot, getDoc, query, orderBy, collection, deleteDoc } from "firebase/firestore";
    import { useFirebase } from "../../../../../composables/useFirebase";
    import { saveItem, deleteItem, finishedPurchase, initExecutePurchase } from '../../../../../composables/firebaseDocs.js';

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
    
    const itensDeleted = ref<any[]>([])
    
    // Listener 1: Para a coleção de Itens
    let unsubscribe: Function | null = null 
    // Listener 2 (Novo): Para o documento de Compra
    let unsubscribePurchase: Function | null = null 

    // O formdata agora é um array de objetos (contém todos os itens de todos os usuários)
    const formdata = ref<any[]>([
      {
        name: null,
        amount: null,
        price: null,
        created_by: authentication.user.id // Default para novos itens
      }
    ])

    // Filtro para saber se o item pertence ao usuário logado
    const isMyItem = (item: any) => {
        // Se não tem ID (é novo), pertence a quem está digitando.
        // Se tem ID, pertence ao criado_por
        return !item.id || item.created_by === authentication.user.id;
    }

    // Função para adicionar um novo item (objeto) ao array
    const addNewItem = () => {
        formdata.value.push({
            name: null,
            amount: null,
            price: null,
            created_by: authentication.user.id // Garante que o item é seu por padrão
        })
    }

    // Função para remover um item do array com base no índice
    const removeItem = (index: number, item: any) => {
        if (!isMyItem(item)) {
            // Se tentar remover um item que não é dele (deveria estar desabilitado na UI)
            console.warn("Apenas o criador pode remover este item.");
            return; 
        }

        if(item.id) {
            itensDeleted.value.push(item.id)
        }
        formdata.value.splice(index, 1);

        // Se a lista ficar vazia, adiciona um item vazio para o formulário não quebrar
        if (formdata.value.length === 0) {
            addNewItem();
        }
    }

    // Função para tratar o valor do preço (substituir vírgula por ponto)
    const formatPrice = (event: any, index: number) => {
      let value = event.target.value;
      value = value.replace(',', '.');
      formdata.value[index].price = value;
    }

    const parseNumber = (value: any) => {
        if (value === null || value === undefined || value === "") return 0;
        // remove tudo que não seja dígito, ponto ou vírgula
        const cleaned = String(value).replace(/[^\d.,-]/g, "").trim();
        if (!cleaned) return 0;
        // se tiver vírgula e ponto, assume que ponto é separador de milhares -> remove pontos
        const hasComma = cleaned.indexOf(",") !== -1;
        const hasDot = cleaned.indexOf(".") !== -1;
        let normalized = cleaned;
        if (hasComma && hasDot) {
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

    // Função AGORA usa onSnapshot para garantir real-time no status da compra
    const getPurchase = () => {
        try {
            // Limpa o listener anterior, se houver
            if (unsubscribePurchase) {
                unsubscribePurchase(); 
            }

            const purchaseRef = doc(
                firestore,
                "Groups",
                authentication.group.id,
                "Purchases",
                route.params.purchaseId
            )

            // Configura o listener em tempo real para o documento de compra
            unsubscribePurchase = onSnapshot(purchaseRef, (purchaseSnap) => {
                if (purchaseSnap.exists()) {
                    const purchaseDoc = {
                        id: purchaseSnap.id,
                        ...purchaseSnap.data(),
                    }

                    purchase.value = purchaseDoc
                    authentication.setCodePurchase(purchase.value.code)
                    
                    // Se a compra AGORA está em execução, inicia o listener de itens.
                    // Chamamos getItens() aqui para garantir que ele comece a ouvir no momento certo.
                    if (purchase.value.is_execute) {
                        getItens()
                    } else {
                        // Se não estiver em execução, e o listener de itens estiver ativo, 
                        // o getItens() precisa ser parado, mas a lógica de getItens() 
                        // e onBeforeUnmount já cuidam disso.
                        loading.value = false;
                    }

                    if(purchase.value.is_closed) {
                        router.push(`/conta/compras/${purchase.value.id}/exibir`)
                    }
                } else {
                    console.error("Documento de compra não encontrado.");
                    loading.value = false;
                }
            }, (error) => {
                console.error("Erro ao ouvir purchase em tempo real:", error);
                loading.value = false;
            });
            
        } catch (error) {
            console.error("Erro ao configurar listener de purchase:", error)
            loading.value = false;
        }
    }

    // Usando onSnapshot para real-time nos itens
    const getItens = () => {
        if (unsubscribe) {
            unsubscribe(); // Limpa o listener antigo de Itens
        }
        
        const q = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", purchase.value.id, "Models", purchase.value.purchase_final_id, "Items"),
            orderBy("created_at", "desc"),
        )

        // Escutando em tempo real
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Os itens do Firestore (a fonte da verdade para itens salvos)
            const itemsFromDb = items.filter(item => item.id); 

            // PASSO 1 REESCRITO: Pega **APENAS** os itens novos/não-salvos do formulário
            // Estes são os itens que o usuário está digitando AGORA e que ainda não têm um ID.
            // O `isMyItem` garante que você não pegue itens vazios criados para outros usuários
            const myUnsavedEdits = formdata.value.filter(item => !item.id && isMyItem(item));

            // 2. Todos os itens salvos de TODOS os usuários, conforme o Firestore
            // (Aqui, itens do seu usuário que foram salvos JÁ estão incluídos na lista itemsFromDb)
            // itemsFromDb já é a lista completa dos itens SALVOS
            const allSavedItems = itemsFromDb; 

            // 3. Remova itens dos outros usuários (esta linha é CONFUSA e deve ser removida)
            // Você não precisa de othersItems se o passo 4 for feito corretamente.

            // 4. Junta a Fonte da Verdade (todos os salvos) com as Edições Não-Salvas (só as minhas)
            const mergedFormdata = [...allSavedItems, ...myUnsavedEdits];
            
            // Filtra itens incompletos (apenas se a lista não estiver vazia)
            const cleanFormdata = mergedFormdata.filter(item => item.name || item.amount || item.price || item.id);

            // Garante que o formulário tenha pelo menos um item vazio se a lista de itens salvos estiver vazia
            if (cleanFormdata.length === 0 || !cleanFormdata.some(item => !item.id && isMyItem(item))) {
                 // Adiciona um item vazio se não houver itens e/ou se não houver um item novo para digitação
                 formdata.value = [...cleanFormdata, { name: null, amount: null, price: null, created_by: authentication.user.id }];
            } else {
                // Reordena para mostrar os meus itens primeiro na lista de edição
                cleanFormdata.sort((a, b) => {
                    const aIsMine = isMyItem(a);
                    const bIsMine = isMyItem(b);
                    if (aIsMine && !bIsMine) return -1;
                    if (!aIsMine && bIsMine) return 1;
                    // Mantenha a ordenação original (por created_at) para os demais
                    return 0;
                });
                formdata.value = cleanFormdata;
            }


            totalResult.value = items.length;
            loading.value = false;
        }, (error) => {
            console.error("Erro ao ouvir itens em tempo real:", error);
            loading.value = false;
        });
    }

    const deleteItems = async () => {
        // Criamos uma nova função para deletar APENAS OS MEUS itens deletados.
        const myItemsToDelete = itensDeleted.value.filter(itemId => 
            // Confiamos na UI ter impedido a adição de IDs que não são seus ao array
            itemId 
        );

        if (myItemsToDelete.length === 0) return;

        try {
            const promises = myItemsToDelete.map(async (itemId) => {
                // Remove o item do Firestore
                await deleteItem(authentication.group.id, purchase.value.id, purchase.value.purchase_final_id, itemId);
            });

            await Promise.all(promises);
            
            // alert("Itens deletados com sucesso!"); // Substituir por feedback visual melhor
            itensDeleted.value = []; // Limpa o array de deletados
        } catch (error) {
            console.error("Erro ao deletar itens:", error);
            // alert("Erro ao deletar itens.");
        }
    }

    const execute = async () => {
        try {
            await initExecutePurchase(
                authentication.group.id, 
                purchase.value.id, 
                purchase.value.purchase_planned_id, 
                purchase.value.purchase_final_id, 
                purchase.value.purchase_geral_id,
                authentication.user.id // Passa o ID do usuário que está iniciando
            ).
                then(() => {
                    // Após iniciar, o listener de purchase (getPurchase) já vai atualizar
                    // e chamar o getItens() se necessário.
                })
        } catch(error) {
            console.log(error)
        }
    }

    const finishPurchase = async() => {
        try {
            await savedItens(); // Salva antes de finalizar, para garantir

            await finishedPurchase(
                authentication.group.id, 
                purchase.value.id,
                purchase.value.purchase_final_id,
                purchase.value.purchase_planned_id,
                Number(totalAmount.value) || 0,
                parseFloat(String(totalPrice.value).replace(",", ".")) || 0,
                purchase.value.purchase_geral_id
            ).
                then(() => {
                    alert("Compra finalizada com sucesso!");
                    router.push(`/conta/compras/${purchase.value.id}/exibir`)
                })
        } catch(error) {
            console.log(error)
        }
    }

    const savedItens = async() => {
        // Filtra para garantir que só estou tentando salvar itens que me pertencem
        const myItemsToSave = formdata.value.filter(item => isMyItem(item));

        // Filtra itens incompletos (sem nome)
        const validItemsToSave = myItemsToSave.filter(item => item.name?.trim());

        if (!validItemsToSave.length) {
            alert("Adicione pelo menos um item com nome válido.");
            return;
        }

        try {
            // Passo 1: Deleção (só dos meus itens que foram marcados para deletar)
            if(itensDeleted.value.length > 0) {
                await deleteItems()
            }
            
            // Passo 2: Criação/Atualização (só dos meus itens)
            const promises = validItemsToSave.map(async (item) => {
                const formattedItem = {
                    id: item.id ?? null,
                    name: item.name?.trim(),
                    amount: Number(item.amount) || 0,
                    price: parseNumber(item.price), // Usamos parseNumber aqui
                    created_by: authentication.user.id,
                };
                
                // O saveItem salva na subcoleção correta (purchase_final_id)
                await saveItem(authentication.group.id, purchase.value.id, purchase.value.purchase_final_id, formattedItem);
            });

            await Promise.all(promises);
            
            alert("Itens salvos com sucesso!"); // Substituir por feedback
        } catch (error) {
            console.error("Erro ao finalizar/salvar a compra:", error);
            // alert("Erro ao finalizar/salvar a compra.");
        }
    }


    onBeforeMount(() => {
        params.changeRouteCurrent('purchase')
    })
    
    // Antes de desmontar, remove TODOS os listeners em tempo real
    onBeforeUnmount(() => {
        if (unsubscribe) { // Listener de Itens
            unsubscribe();
        }
        if (unsubscribePurchase) { // Listener de Compra
            unsubscribePurchase();
        }
    })

    onMounted(() => {
        if(!Object.keys(authentication.group || {}).length) {
            router.push('/conta/grupos')
        } else {
            getPurchase() // Agora configura o listener do documento de compra
        }
    })
</script>

<template>
    <main class="container mx-auto px-4 max-w-4xl">
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="text-center space-y-3">
                <div class="space-y-1">
                    <h2 class="text-3xl font-bold text-gray-800">Executar Compra</h2>
                    <h3 class="text-xl font-semibold text-orange-600">Registro Real</h3>
                </div>
                <p class="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    É hora de registrar os itens realmente comprados.
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-center space-x-4">
                <NuxtLink 
                    :to="`/conta/compras/${route.params.purchaseId}/exibir`" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                    Exibir Compra
                </NuxtLink>
                <Button
                    v-if="!purchase.is_execute"
                    @click="execute()"
                    label="Iniciar Execução"
                    color="bg-purple-600 hover:bg-purple-700"
                />
            </div>

            <!-- Status Alert -->
            <div 
                v-if="!purchase.is_execute"
                class="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 shadow-sm"
            >
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="w-5 h-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-orange-800">
                            Execução não iniciada
                        </p>
                        <p class="text-sm text-orange-700 mt-1">
                            É preciso <strong>iniciar a execução</strong> para ver e editar os dados dos produtos.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Totals Card -->
            <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Resumo da Execução</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p class="text-sm font-medium text-gray-600">Quantidade Total</p>
                        <p class="text-2xl font-bold text-gray-800 mt-1">
                            {{ purchase.is_execute ? totalAmount : '—' }}
                        </p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p class="text-sm font-medium text-gray-600">Valor Total</p>
                        <p class="text-2xl font-bold text-orange-600 mt-1">
                            {{ purchase.is_execute ? totalPriceFormatted : '—' }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Items Section -->
            <section v-if="purchase.is_execute" class="space-y-4">
                <div v-if="loading" class="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="flex justify-center items-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                        <span class="text-gray-600 font-medium">Carregando itens...</span>
                    </div>
                </div>

                <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-6">Itens Comprados</h3>
                        
                        <div class="space-y-4">
                            <div 
                                v-for="(item, index) in formdata" 
                                :key="index" 
                                :class="[
                                    'rounded-lg p-4 border transition-all duration-200 relative group',
                                    isMyItem(item) 
                                        ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-300' 
                                        : 'bg-gray-100 border-gray-300'
                                ]"
                            >
                                <!-- Item Badge -->
                                <div class="absolute -top-2 left-4 z-20">
                                    <span
                                        v-if="isMyItem(item) && item.id"
                                        class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow-md font-medium"
                                    >
                                        Meu Item
                                    </span>
                                    <span
                                        v-else-if="!isMyItem(item)"
                                        class="bg-gray-600 text-white text-xs px-3 py-1 rounded-full shadow-md font-medium"
                                    >
                                        Outro Usuário
                                    </span>
                                    <span
                                        v-else-if="!item.id"
                                        class="bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-md font-medium"
                                    >
                                        Novo Item
                                    </span>
                                </div>

                                <!-- Overlay for other users' items -->
                                <div
                                    v-if="!isMyItem(item)"
                                    class="absolute inset-0 bg-gray-100/50 rounded-lg pointer-events-none"
                                ></div>

                                <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                    <!-- Item Name -->
                                    <div class="lg:col-span-7">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Nome do Item
                                        </label>
                                        <input 
                                            v-model="item.name" 
                                            type="text" 
                                            placeholder="Digite o nome do item..."
                                            :disabled="!isMyItem(item)"
                                            :readonly="purchase.is_closed"
                                            :class="[
                                                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200',
                                                isMyItem(item)
                                                    ? 'border-indigo-300 focus:ring-indigo-500 bg-white'
                                                    : 'border-gray-400 bg-gray-200 cursor-not-allowed'
                                            ]"
                                        >
                                    </div>
                                    
                                    <!-- Quantity and Price -->
                                    <div class="lg:col-span-5">
                                        <div class="grid grid-cols-2 gap-3">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                                    Quantidade
                                                </label>
                                                <input 
                                                    v-model="item.amount" 
                                                    type="number" 
                                                    placeholder="0"
                                                    :disabled="!isMyItem(item)"
                                                    :readonly="purchase.is_closed"
                                                    :class="[
                                                        'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 text-center',
                                                        isMyItem(item)
                                                            ? 'border-indigo-300 focus:ring-indigo-500 bg-white'
                                                            : 'border-gray-400 bg-gray-200 cursor-not-allowed'
                                                    ]"
                                                >
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                                    Preço (R$)
                                                </label>
                                                <div :class="[
                                                    'relative rounded-lg border transition-all duration-200',
                                                    isMyItem(item)
                                                        ? 'border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent'
                                                        : 'border-gray-400 bg-gray-200'
                                                ]">
                                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                                                        R$
                                                    </span>
                                                    <input
                                                        v-model="item.price"
                                                        type="text"
                                                        placeholder="0,00"
                                                        :disabled="!isMyItem(item)"
                                                        :readonly="purchase.is_closed"
                                                        @input="formatPrice($event, index)"
                                                        :class="[
                                                            'w-full pl-10 pr-3 py-2 bg-transparent focus:outline-none rounded-lg',
                                                            isMyItem(item) ? '' : 'cursor-not-allowed'
                                                        ]"
                                                    >
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Delete Button -->
                                <div 
                                    v-if="formdata.length > 0 && isMyItem(item) && !purchase.is_closed" 
                                    class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
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
                        <div 
                            v-if="!purchase.is_closed" 
                            class="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-200 space-y-4 sm:space-y-0"
                        >
                            <button 
                                @click.prevent="addNewItem" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span>Adicionar Item</span>
                            </button>
                            
                            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                <button 
                                    @click.prevent="savedItens()" 
                                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    <span>Salvar Itens</span>
                                </button>
                                <button 
                                    @click.prevent="finishPurchase()" 
                                    class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    <span>Finalizar Compra</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Empty State -->
            <section v-else class="max-w-2xl mx-auto w-full">
                <div class="bg-gray-50 rounded-xl p-10 text-center border border-gray-200">
                    <div class="text-gray-400 mb-3">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                    </div>
                    <p class="text-gray-600 font-medium">
                        Inicie a execução para ver e registrar os produtos comprados.
                    </p>
                </div>
            </section>
        </div>
    </main>
</template>