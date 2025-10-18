<script setup lang="ts">
    import { useParams } from '../stores/params.js';
    import { useAuthentication } from '../stores/authentication.js';

    const isModal = ref<boolean>(false);
    const router = useRouter();
    const params = useParams();
    const authentication = useAuthentication();

    const navigation = (url: string) => {
        router.push(url)
    }

    const goGroups = () => {
        authentication.setGroup({})
        router.push('/conta/grupos')
    }
</script>

<template>
    <div class="min-h-screen w-full bg-white flex flex-col">
        <!-- Topbar -->
        <header class="h-16 bg-gray-600 shadow-md flex items-center justify-between px-4 text-white">
            <h1 class="text-lg font-bold">Gerenciador</h1>
            <div class="flex items-center">
                <ButtonIcon @click="navigation(`/conta/amigos`)" icon="mdi:account-group" color="border-white border-1" iconClass="" class="mr-3" />
                <ButtonIcon v-if="params.routeCurrent !== 'purchases' && Object.keys(authentication.group || {}).length" @click="navigation(`/conta/compras`)" icon="mdi:newspaper" label="Compras" color="border-white border-1" iconClass="" class="mr-3" />
                <ButtonIcon v-if="params.routeCurrent !== 'groups' && Object.keys(authentication.group || {}).length" @click="goGroups" icon="mdi:newspaper" label="Grupos" color="border-white border-1" iconClass="" class="mr-3" />
                <ButtonIcon @click="navigation(`/`)" icon="mdi:reply-outline" label="Sair" color="border-white border-1" iconClass="" class="mr-3" />
                <ButtonIcon @click="navigation(`/configuracao`)" icon="mdi:cog" color="border-white border-1" iconClass="" />
            </div>
        </header>

        <!-- Conteúdo da Página -->
        <main class="flex-1 overflow-auto p-4">
            <slot />
        </main>

        <!-- Footer opcional -->
        <footer class="h-12 bg-gray-600 flex items-center justify-center text-sm text-white">
            © 2025
        </footer>
    </div>
</template>