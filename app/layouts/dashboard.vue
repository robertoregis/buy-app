<script setup lang="ts">
    import { useParams } from '../stores/params.js';
    import { useAuthentication } from '../stores/authentication.js';
    import { collection, getDocs, query, where,
        getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
        limit
    } from 'firebase/firestore';
    import { useFirebase } from '../composables/useFirebase';
    import { signOut, getAuth } from "firebase/auth";

    const isModal = ref<boolean>(false);
    const router = useRouter();
    const params = useParams();
    const { firestore } = useFirebase();
    const authentication: any = useAuthentication();
    const { notify } = useNotification();
    const totalResultWarnings = ref<number>(0);
    const totalResultFriendRequests = ref<number>(0);
    
    // Estado para menu mobile
    const isMobileMenuOpen = ref<boolean>(false);

    const navigation = (url: string) => {
        router.push(url);
        isMobileMenuOpen.value = false; // Fecha menu mobile após navegação
    }

    const goGroups = () => {
        if(Object.keys(authentication.group || {}).length) {
            authentication.setGroup({});
        }
        router.push('/conta/grupos');
        isMobileMenuOpen.value = false;
    }

    const countWarnings = async () => {
        const date = new Date()
        date.setDate(date.getDate() - 1)
        let constraints = [
            //where("is_closed", "==", false),
            where("user_id", "==", authentication.user.id),
            where("created_at", ">", date),
        ];
        let q = query(collection(firestore, "Warnings"), ...constraints);
        const snapshot = await getCountFromServer(q);
        totalResultWarnings.value = snapshot.data().count
        authentication.setCountWarnings(snapshot.data().count)
    }

    const countFriendRequests = async () => {
        let constraints = [
            where("is_closed", "==", false),
            where("user_to_id", "==", authentication.userId)
        ];
        let q = query(collection(firestore, "FriendRequests"), ...constraints);
        const snapshot = await getCountFromServer(q);
        totalResultFriendRequests.value = snapshot.data().count
        authentication.setCountFriendRequests(snapshot.data().count)
    }

    // Fecha menu mobile ao redimensionar para desktop
    const handleResize = () => {
        if (window.innerWidth >= 768) {
            isMobileMenuOpen.value = false;
        }
    }

    const logout = async () => {
        const auth: any = getAuth()
        authentication.setUser({})
        authentication.setUserId(null)
        authentication.setGroup({})
        authentication.setCodePurchase(null)
        await signOut(auth);
        notify({
            text: "Você foi deslogado!",
            type: "error",
        });
        router.push('/')
    }

    onMounted(() => {
        countFriendRequests();
        countWarnings();
        window.addEventListener('resize', handleResize);
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
    })
</script>

<template>
    <div class="min-h-screen w-full bg-gray-50 flex flex-col">
        <!-- Topbar -->
        <header class="h-16 bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg flex items-center justify-between px-4 md:px-6 text-white sticky top-0 z-50">
            <!-- Logo e Título -->
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg class="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                </div>
                <h1 class="text-lg font-bold hidden sm:block">Gerenciador de Compras</h1>
                <h1 class="text-lg font-bold sm:hidden">GC</h1>
                <button @click="navigation('/conta/avisos')" class="flex items-center justify-center relative cursor-pointer">
                    <Icon name="mdi:bell-ring" class="text-2xl inline-block align-middle" />
                    <div v-if="authentication.countWarnings > 0" class="absolute top-[-7px] right-[-7px] p-2 w-[17px] h-[17px] rounded-full bg-orange-500 flex justify-center items-center">
                        <span class="font-bold inline-block align-middle">{{ authentication.countWarnings }}</span>
                    </div>
                </button>
            </div>
            <!-- Desktop Navigation -->
            <div class="hidden lg:flex items-center space-x-2">
                <button 
                    @click="navigation('/conta/amigos')"
                    class="cursor-pointer relative flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    <Icon name="mdi:account-multiple-check" class="text-lg" />
                    <span class="text-sm font-medium">Amigos</span>
                    <div v-if="authentication.countFriendRequests > 0" class="absolute top-[-2px] right-[-2px] p-2 w-[20px] h-[20px] rounded-full bg-green-500 flex justify-center items-center">
                        <span class="font-bold inline-block align-middle">{{ authentication.countFriendRequests }}</span>
                    </div>
                </button>

                <button 
                    v-if="params.routeCurrent !== 'purchases' && Object.keys(authentication.group || {}).length"
                    @click="navigation('/conta/compras')"
                    class="cursor-pointer flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    <Icon name="mdi:cart" class="text-lg" />
                    <span class="text-sm font-medium">Compras</span>
                </button>

                <button
                    v-if="Object.keys(authentication.group || {}).length"
                    @click="navigation(`/conta/grupos/${authentication.group.id}`)"
                    class="cursor-pointer flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    <Icon name="mdi:account-group" class="text-lg" />
                    <span class="text-sm font-medium">Grupo</span>
                </button>

                <button
                    @click="goGroups"
                    class="cursor-pointer flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    <Icon name="mdi:account-group" class="text-lg" />
                    <span class="text-sm font-medium">{{ Object.keys(authentication.group || {}).length ? 'Sair do grupo' : 'Grupos' }}</span>
                </button>

                <button 
                    @click="navigation('/conta/configuracao')"
                    class="cursor-pointer flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                    <Icon name="mdi:cog" class="text-lg" />
                    <span class="text-sm font-medium">Configurações</span>
                </button>

                <button 
                    @click="logout()"
                    class="cursor-pointer flex items-center xl:space-x-2 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg transition-all duration-200 shadow-sm"
                >
                    <Icon name="mdi:logout" class="text-lg" />
                    <span class="hidden xl:inline text-sm font-medium">Sair</span>
                </button>
            </div>

            <!-- Mobile Menu Button -->
            <button 
                @click="isMobileMenuOpen = !isMobileMenuOpen"
                class="relative lg:hidden flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
                <Icon 
                    :name="isMobileMenuOpen ? 'mdi:close' : 'mdi:menu'" 
                    class="text-xl" 
                />
                <div v-if="authentication.getCountTotalMenu > 0" class="absolute top-[-4px] right-[-4px] p-2 w-[16px] h-[16px] rounded-full bg-orange-500 flex justify-center items-center">
                    <span class="text-sm font-bold inline-block align-middle">{{ authentication.getCountTotalMenu }}</span>
                </div>
            </button>
        </header>

        <!-- Mobile Menu -->
        <div 
            v-if="isMobileMenuOpen"
            class="lg:hidden fixed inset-x-0 top-16 bg-gray-800 shadow-lg z-40 animate-slideDown"
        >
            <div class="px-4 py-3 space-y-2">
                <button 
                    @click="navigation('/conta/amigos')"
                    class="cursor-pointer relative w-full flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-all duration-200 text-white"
                >
                    <Icon name="mdi:account-multiple-check" class="text-xl" />
                    <span class="font-medium">Amigos</span>
                    <div v-if="authentication.countFriendRequests > 0" class="absolute top-[-2px] right-[-2px] p-2 w-[20px] h-[20px] rounded-full bg-orange-500 flex justify-center items-center">
                        <span class="font-bold inline-block align-middle">{{ authentication.countFriendRequests }}</span>
                    </div>
                </button>

                <button 
                    v-if="params.routeCurrent !== 'purchases' && Object.keys(authentication.group || {}).length"
                    @click="navigation('/conta/compras')"
                    class="cursor-pointer w-full flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-all duration-200 text-white"
                >
                    <Icon name="mdi:cart" class="text-xl" />
                    <span class="font-medium">Compras</span>
                </button>

                <button 
                    v-if="Object.keys(authentication.group || {}).length"
                    @click="navigation(`/conta/grupos/${authentication.group.id}`)"
                    class="cursor-pointer w-full flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-all duration-200 text-white"
                >
                    <Icon name="mdi:account-group" class="text-xl" />
                    <span class="font-medium">Grupo</span>
                </button>

                <button 
                    v-if="params.routeCurrent !== 'groups' && Object.keys(authentication.group || {}).length"
                    @click="goGroups"
                    class="cursor-pointer w-full flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-all duration-200 text-white"
                >
                    <Icon name="mdi:account-group" class="text-xl" />
                    <span class="font-medium">{{ Object.keys(authentication.group || {}).length ? 'Sair do grupo' : 'Grupos' }}</span>
                </button>
                

                <button 
                    @click="navigation('/conta/configuracao')"
                    class="cursor-pointer w-full flex items-center space-x-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-all duration-200 text-white"
                >
                    <Icon name="mdi:cog" class="text-xl" />
                    <span class="font-medium">Configurações</span>
                </button>

                <button 
                    @click="logout()"
                    class="cursor-pointer w-full flex items-center space-x-3 bg-red-500 hover:bg-red-600 px-4 py-3 rounded-lg transition-all duration-200 text-white"
                >
                    <Icon name="mdi:logout" class="text-xl" />
                    <span class="font-medium">Sair</span>
                </button>
            </div>
        </div>

        <!-- Overlay para Mobile -->
        <div 
            v-if="isMobileMenuOpen"
            @click="isMobileMenuOpen = false"
            class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        ></div>

        <!-- Conteúdo da Página -->
        <main class="flex-1 overflow-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
            <div class="bg-white p-2 rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-12rem)]">
                <slot />
            </div>
            
        </main>

        <!-- Footer -->
        <footer class="h-12 bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center text-sm text-gray-300 shadow-inner">
            <div class="flex items-center space-x-4">
                <span>© 2025 Gerenciador de Compras</span>
                <span class="hidden sm:block">•</span>
                <span class="hidden sm:block">Feito com 💚</span>
            </div>
        </footer>
    </div>
</template>

<style scoped>
.animate-slideDown {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Custom scrollbar para o main */
main::-webkit-scrollbar {
    width: 6px;
}

main::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

main::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

main::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>