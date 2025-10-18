<script setup lang="ts">
    import { useParams } from '../../../../stores/params.js';
    import { useAuthentication } from '../../../../stores/authentication.js';
    import { createPurchase } from '../../../../composables/firebaseDocs.js';

    const params = useParams();

    definePageMeta({
        layout: 'dashboard'
    })

    const authentication = useAuthentication();
    const router = useRouter()
    const formdata = ref<any>({
        name: null,
        description: null,
    })

    // O formdata agora é um array de objetos
    const formdataItems = ref<any[]>([
      {
        title: null,
        quantity: null,
        price: null
      }
    ])

    // Função para adicionar um novo item (objeto) ao array
    const addNewItem = () => {
        formdataItems.value.push({
            title: null,
            quantity: null,
            price: null
        })
    }

    // Função para remover um item do array com base no índice
    const removeItem = (index: number) => {
        if (formdataItems.value.length > 1) {
            formdataItems.value.splice(index, 1);
        }
    }

    // Função para tratar o valor do preço (substituir vírgula por ponto)
    const formatPrice = (event: any, index: number) => {
      let value = event.target.value;
      value = value.replace(',', '.');
      formdataItems.value[index].price = value;
    }

    /*const send = async () => {
        try {
          await createPurchase({
            name: formdata.value,
            version: '',
            friends: [],
            friend_requests_sent: [],
            friend_requests_received: [],
          })
        } catch(error) {
          console.log(error)
        }
    }*/

    onBeforeMount(() => {
        params.changeRouteCurrent('purchases')
    })

    onMounted(() => {
        if(!Object.keys(authentication.group || {}).length) {
            router.push('/conta/grupos')
        }
    })
</script>

<template>
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <h2 class="text-center text-2xl font-[600]">Criar compra</h2>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1">
                        <form action="" class="grid grid-cols-1">
                            <div class="col-span-1">
                                <div class="grid grid-cols-1">
                                    <div class="col-span-1">
                                        <div class="flex flex-col relative mt-1">
                                            <label v-if="formdata.name" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Título:</label>
                                            <input v-model="formdata.name" type="text" name="" id="" placeholder="Título" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-1">
                                <div v-for="(item, index) in formdataItems" :key="index" class="p-2 bg-white shadow rounded relative">
                                    <div class="grid grid-cols-1 md:grid-cols-10 gap-2 md:gap-4 items-center">
                                        <div class="col-span-1 md:col-span-7">
                                            <div class="flex flex-col relative">
                                                <label v-if="item.title" class="absolute top-[-11px] left-[5px] text-gray-500" style="z-index: 100;">Título:</label>
                                                <input v-model="item.title" type="text" placeholder="Título" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-10 gap-2 col-span-1 md:col-span-3">
                                            <div class="col-span-4 md:col-span-3">
                                                <div class="flex flex-col relative">
                                                    <label v-if="item.quantity" class="absolute top-[-11px] left-[5px] text-gray-500" style="z-index: 100;">Quantidade:</label>
                                                    <input v-model="item.quantity" type="number" placeholder="Qtd." class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
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
                                    <div v-if="formdataItems.length > 1" class="absolute top-[-5px] right-[-5px]">
                                        <button @click.prevent="removeItem(index)" class="bg-red-500 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM4.5 4h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM11 2H5v1h6V2z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-span-1 mt-4">
                                <div class="flex items-center justify-between">
                                    <button @click.prevent="addNewItem" class="bg-blue-500 text-white py-2 px-4 rounded">
                                        Adicionar Novo Item
                                    </button>
                                    <Button label="Salvar" color="bg-green-700" />
                                </div>
                            </div>
                        </form>
                    
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>