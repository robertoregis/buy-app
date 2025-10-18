<script setup lang="ts">
    import { useParams } from '../../../../../stores/params.js';
    import { useAuthentication } from '../../../../../stores/authentication.js';
    import { doc, onSnapshot, getDoc, query, where, orderBy, getDocs, getCountFromServer, collection } from "firebase/firestore";
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
    const purchaseItens = ref<any[]>([])
    const itensDeleted = ref<any[]>([])

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
                getItens()
            }
        } catch (error) {
            console.error("Erro ao buscar purchase:", error)
        }
    }

    const getItens = async () => {
        try {
            // Query base para contagem
            const countQuery = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", purchase.value.id, "Models", purchase.value.purchase_final_id, "Items"))
            const countSnap = await getCountFromServer(countQuery)
            totalResult.value = countSnap.data().count

            // Query para buscar os dados
            const q = query(
            collection(firestore, "Groups", authentication.group.id, "Purchases", purchase.value.id, "Models", purchase.value.purchase_final_id, "Items"),
                orderBy("created_at", "desc"),
            )

            const querySnapshot = await getDocs(q)
            formdata.value = querySnapshot.docs.map(doc => ({
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

    const deleteItems = async () => {
        try {
            // cria um array de promessas (uma para cada item)
            const promises = itensDeleted.value.map(async (item) => {
                await deleteItem(authentication.group.id, purchase.value.id, purchase.value.purchase_final_id, item);
            });

            // espera todas as criações terminarem
            await Promise.all(promises);

            alert("Itens deletados com sucesso!");
        } catch (error) {
            console.error("Erro ao deletar itens:", error);
            alert("Erro ao deletar itens.");
        }
    }

    const execute = async () => {
        alert('kkdkd')
        try {
            await initExecutePurchase(authentication.group.id, purchase.value.id, purchase.value.purchase_planned_id, purchase.value.purchase_final_id).
                then(() => {
                    alert('kkkk')
                    getPurchase()
                })
        } catch(error) {
            console.log(error)
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

                await saveItem(authentication.group.id, purchase.value.id, purchase.value.purchase_final_id, formattedItem);
            });

            // espera todas as criações terminarem
            await Promise.all(promises);

            try {
                await finishedPurchase(
                    authentication.group.id, 
                    purchase.value.id,
                    purchase.value.purchase_final_id,
                    purchase.value.purchase_planned_id,
                    Number(totalAmount.value) || 0,
                    parseFloat(String(totalPrice.value).replace(",", ".")) || 0,
                ).
                    then(() => {
                        router.push(`/conta/compras/${purchase.value.id}/exibir`)
                    })
            } catch(error) {
                console.log(error)
            }

            alert("Compra finalizada com sucesso!");
        } catch (error) {
            console.error("Erro ao finalizar a compra:", error);
            alert("Erro ao finalizar a compra.");
        }
    };


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
                    <h2 class="text-center text-2xl font-[500]">Executar</h2>
                    <h3 class="text-center text-lg font-[600]">Compra</h3>
                </div>
                <p class="mt-2">Chegou o momento de você executar a compra.</p>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1">
                        <div class="flex justify-center items-center">
                            <NuxtLink :to="`/conta/compras/${route.params.purchaseId}/exibir`" class="bg-green-700 text-white px-5 py-1 rounded">Exibir</NuxtLink>
                            <Button v-if="!purchase.is_execute" @click="execute()" label="Iniciar execução" color="bg-purple-700" class="ml-3" />
                        </div>
                    </div>
                    <div class="col-span-1 mt-6 p-4 bg-gray-100 rounded shadow">
                        <div v-if="!purchase.is_execute" class="flex">
                            <div class="bg-orange-400 px-2">É preciso iniciar a execução para ver os dados</div>
                        </div>
                        <h3 class="text-xl font-bold">Totais</h3>
                        <div class="mt-2 flex justify-between">
                            <p class="text-lg font-medium">Quantidade Total:</p>
                            <p class="text-lg font-bold">{{ purchase.is_execute ? totalAmount : '***' }}</p>
                        </div>
                        <div class="flex justify-between">
                            <p class="text-lg font-medium">Valor Total:</p>
                            <p class="text-lg font-bold">{{ purchase.is_execute ? `R$ ${totalPrice.toFixed(2)}` : '***' }}</p>
                        </div>
                    </div>
                    <div v-if="purchase.is_execute" class="col-span-1 mt-4">
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
                                <div v-if="formdata.length > 1" class="absolute top-[-5px] right-[-5px]">
                                    <button @click.prevent="removeItem(index, item)" class="bg-red-500 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM4.5 4h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM11 2H5v1h6V2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="col-span-1 mt-4">
                                <div class="flex items-center justify-between">
                                    <button @click.prevent="addNewItem" class="bg-blue-500 text-white py-2 px-4 rounded">
                                        Adicionar Novo Item
                                    </button>
                                    <Button @click.prevent="send()" label="Salvar" color="bg-green-700" />
                                </div>
                            </div>
                        </form>
                    
                    </div>

                    <div v-else class="col-span-1 mt-4">
                        <div class="flex">
                            <span>É preciso iniciar a execução para ver os produtos</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </main>
</template>