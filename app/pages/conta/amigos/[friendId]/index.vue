<script setup lang="ts">
  import { useParams } from '../../../../stores/params.js';
  const params = useParams();
  definePageMeta({
    layout: 'dashboard'
  })
  const isView = ref<boolean>(false)
  const router = useRouter();

  onMounted(() => {
    //router.push(`/`)
  })
  
</script>

<template>
  <main class="container mx-auto">
    <div class="grid grid-cols">
      <div class="col-span-1 mt-4">
          <h2 class="text-center text-2xl font-[600]">Amigos</h2>
      </div>

      <div class="col-span-1 mt-6">
          <div class="grid grid-cols-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">

                <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <span class="font-weight-500 text-[0.650rem]">amigos desde 17/09/2025</span>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>

                <!--<div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <div class="flex items-center">
                        <button class="flex">
                          <Icon name="mdi:close-circle" class="text-red-700 text-xl" />
                        </button>
                        <button class="flex ml-1">
                          <Icon name="mdi:check-circle" class="text-green-700 text-xl" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <div class="flex items-center">
                        <button class="flex">
                          <Icon name="mdi:plus-box" class="text-green-700 text-xl" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-1 shadow-lg bg-white p-2 border-1 border-neutral-200">
                  <div class="flex flex-col">
                    <div class="flex justify-end">
                      <div class="flex items-center">
                        <button class="flex">
                          <Icon name="mdi:close-circle" class="text-red-700 text-xl" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                      <span class="ml-3">Nome da pessoa</span>
                    </div>
                  </div>
                </div>-->

              </div>
          </div>
      </div>
    </div>
  </main>
  <!--
  <main>
    <div class="container p-6">
      <div class="grid grid-cols-1">
        <div class="w-[100%] max-w-[1000px]">
          <div class="grid grid-cols-1">
            <div class="col-span-1">
              <div class="grid grid-cols-1 mt-4">
                <div class="col-span-1">
                  <div class="grid grid-cols-1 bg-white p-2 shadow-lg border-1 border-neutral-200">
                    <div class="col-span-1">
                      <h2 class="text-lg mb-0">Amigos</h2>
                    </div>
                    <div class="col-span-1 mt-2">
                      <div class="flex items-center">
                        <div class="w-[42px] h-[42px] rounded-full bg-blue-200"></div>
                        <span class="ml-3">Nome da pessoa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 mt-4">
                <div class="col-span-1">
                  <div class="grid grid-cols-1 bg-white p-2 shadow-lg border-1 border-neutral-200">
                    <div class="col-span-1">
                      <div class="w-[68px] h-[68px] rounded-full bg-blue-200"></div>
                      <h2 class="text-lg mb-0">Fulano</h2>
                    </div>
                    <div class="col-span-1 mt-2">
                      <div class="flex flex-col">
                        <div class="flex items-center">
                          <span>Amizade desde:</span>
                          <span class="ml-2 font-weight-500">29/10/2025</span>
                        </div>
                        <div class="flex items-center">
                          <span>Compras feitas com você:</span>
                          <span class="ml-2 font-weight-500">21</span>
                        </div>
                        <div class="flex items-center">
                          <span>Ranking de amizade:</span>
                          <span class="ml-2 font-weight-500">1˚</span>
                        </div>
                      </div>
                    </div>

                    <div class="col-span-1 mt-4">
                      <div class="grid grid cols-1">
                        <div class="col-span-1">
                          <h1 class="mb-0 text-xl">Organizações que os dois participam juntos</h1>
                        </div>
                        <div class="col-span-1 mt-2">
                          <grid class="grid-cols-1 gap-2">
                            <div class="col-span-1 bg-teal-100 p-2 shadow rounded">
                              <div class="flex items-center">
                                <span>dkdkkdkddk</span>
                                <span>dllddlld</span>
                              </div>
                            </div>
                          </grid>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>-->
</template>

<style lang="scss" scoped>
</style>
