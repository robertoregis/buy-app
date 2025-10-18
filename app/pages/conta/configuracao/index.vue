<script setup lang="ts">
    import { useParams } from '../../../stores/params.js';
    const params = useParams();
    definePageMeta({
        layout: 'dashboard'
    })

    const router = useRouter()
    const isCreateNewModal = ref<boolean>(false)
    const isNewModal = ref<boolean>(false)
    const monthsIndex = ref<number>(0);
    const months: any = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ];
    const changeMonthsIndex = (type: string) => {
        if(type === `max`) {
            monthsIndex.value++
        } else {
            monthsIndex.value--
        }
        if(monthsIndex.value < 0) {
            monthsIndex.value = 11
        } else if(monthsIndex.value > 11) {
            monthsIndex.value = 0
        }
    }

    onBeforeMount(() => {
        params.changeRouteCurrent('config')
    })
</script>

<template>
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <h2 class="text-center text-2xl font-[600]">Novidades</h2>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1">
                        <div class="flex items-center justify-center">
                            <ButtonIcon @click="changeMonthsIndex(`min`)" icon="mdi:arrow-left-thin" iconClass="text-5xl" />
                            <div class="bg-orange-700 text-white mx-2 text-sm font-[500] flex justify-center py-1 w-[100px]"><span>{{ months[monthsIndex] }}</span></div>
                            <ButtonIcon @click="changeMonthsIndex(`max`)" icon="mdi:arrow-right-thin" />
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="flex justify-center items-center">
                            <Button @click="isCreateNewModal = true" label="Criar novidade" color="bg-green-700 text-white" />
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="grid grid-cols-1 gap-4">
                            <template v-for="value in [1, 2, 3, 4, 5, 6, 7, 8]" :key="value">
                                <div @click="isNewModal = true" role="dialog" tabindex="0" class="cursor-pointer col-span-1 p-2 shadow bg-gray-200 rounded">
                                    <div class="flex flex-col">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm mb-1 font-[600]">Título</span>
                                            <span class="text-[0.8rem] mb-1 font-[600]">10h20 19/09/2025</span>
                                        </div>
                                        <p class="text-sm mb-1">Descrição</p>
                                        <div class="flex">
                                            <span class="bg-red-600 text-white text-[0.8rem]" style="padding: 1px 10px;">Importância</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <CreateNewModal v-model="isCreateNewModal" />
    <NewModal v-model="isNewModal" newId="12344" />
</template>
