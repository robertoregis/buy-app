<script setup lang="ts">
    import { useParams } from '../../../stores/params.js';
    import { useAuthentication } from '../../../stores/authentication';
    import { convertDateFirestore } from '../../../composables/convert.js';
    const params = useParams();
    const authentication: any = useAuthentication();
    definePageMeta({
        layout: 'dashboard'
    })

    const router = useRouter()
    

    onBeforeMount(() => {
        params.changeRouteCurrent('config')
    })
</script>

<template>
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <h2 class="text-center text-2xl font-[600]">Configuração</h2>
            </div>

            <div class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1 w-[600px] mx-auto">
                        <div class="flex flex-col">
                            <div class="flex items-center justify-center">
                                <div><img :src="authentication.user.image_url" alt="" class="w-[120px] rounded-full"></div>
                            </div>
                            <div class="flex items-center mt-4">
                                <span class="font-[600] mr-2">Nome:</span>
                                <span>{{ authentication.user.name }}</span>
                            </div>
                            <div class="flex items-center mt-1">
                                <span class="font-[600] mr-2">Email:</span>
                                <span>{{ authentication.user.email}}</span>
                            </div>
                            <div class="flex items-center mt-1">
                                <span class="font-[600] mr-2">Última vez que fez login:</span>
                                <span>{{ convertDateFirestore(authentication.user.last_login) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
