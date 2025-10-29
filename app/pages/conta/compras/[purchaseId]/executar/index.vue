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
    // purchaseItens não é mais necessário, o formdata é a fonte da verdade
    const itensDeleted = ref<any[]>([])
    let unsubscribe: Function | null = null // Para o listener do onSnapshot

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

    const getPurchase = async () => {
        try {
            const purchaseRef = doc(
                firestore,
                "Groups",
                authentication.group.id,
                "Purchases",
                route.params.purchaseId
            )

            const purchaseSnap = await getDoc(purchaseRef)

            if (purchaseSnap.exists()) {
                const purchaseDoc = {
                    id: purchaseSnap.id,
                    ...purchaseSnap.data(),
                }

                purchase.value = purchaseDoc
                authentication.setCodePurchase(purchase.value.code)
                // Se a compra já está em execução, inicia o listener em tempo real
                if (purchase.value.is_execute) {
                    getItens()
                } else {
                    loading.value = false;
                }
            }
        } catch (error) {
            console.error("Erro ao buscar purchase:", error)
        }
    }

    // Usando onSnapshot para real-time
    const getItens = () => {
        if (unsubscribe) {
            unsubscribe(); // Limpa o listener antigo
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

            // CRUCIAL: Mantém os itens dos outros usuários, mas permite a edição dos seus.
            // Para evitar que a tela 'pule' e que os itens vazios sumam, fazemos um merge:
            
            // 1. Pega os itens que SÃO MEUS (ou novos, sem ID) que estão no meu formulário
            const myCurrentEdits = formdata.value.filter(item => isMyItem(item));

            // 2. Pega os itens ATUAIS do banco de dados (de todos, incluindo os meus recém-salvos)
            const itemsFromDb = items.filter(item => item.id); // Itens salvos

            // 3. Remove meus itens salvos do passo 2 para evitar duplicação
            const othersItems = itemsFromDb.filter((item: any) => item.created_by !== authentication.user.id);

            // 4. Junta os itens dos outros com os meus itens que estão em edição
            const mergedFormdata = [...myCurrentEdits, ...othersItems];
            
            // Filtra itens incompletos (apenas se a lista não estiver vazia)
            const cleanFormdata = mergedFormdata.filter(item => item.name || item.amount || item.price || item.id);

            // Garante que o formulário tenha pelo menos um item vazio se a lista de itens salvos estiver vazia
            if (cleanFormdata.length === 0) {
                 formdata.value = [{ name: null, amount: null, price: null, created_by: authentication.user.id }];
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
            // Para ter certeza, você pode adicionar uma verificação de 'created_by' aqui
            // mas confiamos na UI ter impedido a adição de IDs que não são seus ao array
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
        // Aqui você precisa decidir: quem inicia a execução é o "created_by" dos itens copiados?
        // Sim, adicionamos essa lógica no firebaseDocs.ts.
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
                    getPurchase()
                })
        } catch(error) {
            console.log(error)
        }
    }

    // Nova lógica de salvamento colaborativo
    const send = async () => {
        // Filtra para garantir que só estou tentando salvar itens que me pertencem
        const myItemsToSave = formdata.value.filter(item => isMyItem(item));

        // Filtra itens incompletos (sem nome)
        const validItemsToSave = myItemsToSave.filter(item => item.name?.trim());

        if (!validItemsToSave.length) {
            // alert("Adicione pelo menos um item com nome válido.");
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
            
            // Passo 3: Finalização (Só a pessoa que clicar em FINALIZAR faz isso)
            // Se você quiser que o botão 'Salvar' também finalize a compra, mantenha o código abaixo.
            // No entanto, é mais comum ter um botão SEPARADO de 'Finalizar Compra'
            // para que o 'Salvar' seja apenas o salvamento colaborativo.
            
            // *MANTENHO A LÓGICA DE FINALIZAÇÃO DENTRO DO SEND, mas sugiro separá-la no futuro*

            try {
                // ATENÇÃO: Esta parte finaliza a compra. Se você quer que o botão "Salvar" 
                // apenas salve colaborativamente, remova a chamada ao finishedPurchase.
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
                        router.push(`/conta/compras/${purchase.value.id}/exibir`)
                    })
            } catch(error) {
                console.log(error)
            }

            // alert("Compra finalizada com sucesso!"); // Substituir por feedback
        } catch (error) {
            console.error("Erro ao finalizar/salvar a compra:", error);
            // alert("Erro ao finalizar/salvar a compra.");
        }
    };


    onBeforeMount(() => {
        params.changeRouteCurrent('purchase')
    })
    
    // Antes de desmontar, remove o listener em tempo real
    onBeforeUnmount(() => {
        if (unsubscribe) {
            unsubscribe();
        }
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
    <main class="container mx-auto p-4 md:p-0">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <div class="flex flex-col w-full">
                    <h2 class="text-center text-2xl font-semibold text-gray-800">Executar</h2>
                    <h3 class="text-center text-xl font-light text-green-600">Compra</h3>
                </div>
                <p class="mt-2 text-center text-gray-600">É hora de registrar os itens realmente comprados.</p>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <!-- Botões e Status -->
                    <div class="col-span-1 mb-4">
                        <div class="flex justify-center items-center space-x-3">
                            <NuxtLink :to="`/conta/compras/${route.params.purchaseId}/exibir`" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md transition duration-300">Exibir</NuxtLink>
                            <Button v-if="!purchase.is_execute" @click="execute()" label="Iniciar Execução" color="bg-purple-600" class="hover:bg-purple-700" />
                        </div>
                    </div>

                    <!-- Totais -->
                    <div class="col-span-1 mt-3 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <div v-if="!purchase.is_execute" class="flex items-center p-3 bg-orange-100 border border-orange-300 text-orange-800 rounded-md mb-4">
                            <span>É preciso **iniciar a execução** para ver/editar os dados.</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-700 border-b pb-2 mb-2">Resumo da Execução</h3>
                        <div class="mt-2 flex justify-between">
                            <p class="text-lg font-medium text-gray-600">Quantidade Total:</p>
                            <p class="text-xl font-extrabold text-green-600">{{ purchase.is_execute ? totalAmount : '***' }}</p>
                        </div>
                        <div class="flex justify-between">
                            <p class="text-lg font-medium text-gray-600">Valor Total:</p>
                            <p class="text-xl font-extrabold text-green-600">{{ purchase.is_execute ? totalPriceFormatted : '***' }}</p>
                        </div>
                    </div>
                    
                    <!-- Lista de Itens (Formulário) -->
                    <div v-if="purchase.is_execute" class="col-span-1 mt-6">
                        <div v-if="loading" class="text-center p-8 text-gray-500">
                            Carregando itens...
                        </div>
                        <form v-else action="" class="grid grid-cols-1 gap-4">
                            <div v-for="(item, index) in formdata" :key="index" 
                                :class="[
                                    'p-4 rounded-xl shadow-md relative border',
                                    isMyItem(item) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-100 border-gray-300'
                                ]"
                            >
                                <div v-if="!isMyItem(item)" class="absolute top-0 left-0 right-0 bottom-0 bg-gray-100 opacity-50 z-10 rounded-xl pointer-events-none"></div>

                                <span v-if="isMyItem(item) && item.id" class="absolute top-[-10px] left-3 bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md z-20">
                                    Meu item
                                </span>
                                <span v-else-if="!isMyItem(item)" class="absolute top-[-10px] left-3 bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md z-20">
                                    De Outro Usuário
                                </span>

                                <div class="grid grid-cols-1 md:grid-cols-10 gap-3 md:gap-4 items-center relative z-20">
                                    <div class="col-span-1 md:col-span-7">
                                        <div class="flex flex-col relative">
                                            <label class="text-sm font-medium text-gray-500 mb-1">Título:</label>
                                            <input 
                                                v-model="item.name" 
                                                type="text" 
                                                placeholder="Título do Item" 
                                                :disabled="!isMyItem(item)"
                                                :class="['border-2 rounded-lg py-2 px-3 transition duration-150', isMyItem(item) ? 'bg-white border-indigo-300 focus:border-indigo-500' : 'bg-gray-200 border-gray-400 cursor-not-allowed']"
                                            >
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-10 gap-3 col-span-1 md:col-span-3">
                                        <div class="col-span-4 md:col-span-3">
                                            <div class="flex flex-col relative">
                                                <label class="text-sm font-medium text-gray-500 mb-1">Qtd:</label>
                                                <input 
                                                    v-model="item.amount" 
                                                    type="number" 
                                                    placeholder="Qtd." 
                                                    :disabled="!isMyItem(item)"
                                                    :class="['border-2 rounded-lg py-2 px-3 transition duration-150', isMyItem(item) ? 'bg-white border-indigo-300 focus:border-indigo-500' : 'bg-gray-200 border-gray-400 cursor-not-allowed']"
                                                >
                                            </div>
                                        </div>
                                        <div class="col-span-6 md:col-span-7">
                                            <div class="flex flex-col relative">
                                                <label class="text-sm font-medium text-gray-500 mb-1">Preço:</label>
                                                <div :class="['flex items-center border-2 rounded-lg transition duration-150', isMyItem(item) ? 'bg-white border-indigo-300 focus-within:border-indigo-500' : 'bg-gray-200 border-gray-400 cursor-not-allowed']">
                                                    <span class="text-gray-500 font-semibold ml-2">R$</span>
                                                    <input
                                                        v-model="item.price"
                                                        type="text"
                                                        placeholder="0,00"
                                                        :disabled="!isMyItem(item)"
                                                        :class="['w-full py-2 pl-1 pr-3 focus:outline-none rounded-r-lg', isMyItem(item) ? 'bg-white' : 'bg-gray-200 cursor-not-allowed']"
                                                        @input="formatPrice($event, index)"
                                                    >
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-if="formdata.length > 0 && isMyItem(item)" class="absolute top-[-10px] right-[-10px] z-30">
                                    <button @click.prevent="removeItem(index, item)" class="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM4.5 4h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM11 2H5v1h6V2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="col-span-1 mt-4">
                                <div class="flex items-center justify-between">
                                    <button @click.prevent="addNewItem" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md transition duration-300">
                                        Adicionar Novo Item
                                    </button>
                                    <!-- ATENÇÃO: Se o botão 'Salvar' também finaliza, o nome é confuso. Sugiro separar o Salvar do Finalizar. -->
                                    <Button @click.prevent="send()" label="Salvar e Finalizar" color="bg-green-700" class="hover:bg-green-800" />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div v-else class="col-span-1 mt-4">
                        <div class="flex justify-center p-8 bg-gray-100 rounded-lg text-gray-600">
                            <span>Inicie a execução para ver os produtos.</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </main>
</template>
