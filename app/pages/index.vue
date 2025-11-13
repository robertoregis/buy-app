<script setup lang="ts">
    const router = useRouter()
    const isLoginModal = ref<boolean>(false)
    const formdata = ref<any>({
        email: null,
        password: null
    })
    const { notify } = useNotification();
    const send = () => {
        alert(`Não disponível`)
    }
    const goRouter = () => {
        router.push(`/cadastrar`)
    }
    const next = () => {
        if(!formdata.value.email) {
            notify({
                text: 'Informe o email',
                type: 'error'
            })
            return
        }
        isLoginModal.value = true;
    }
</script>

<template>
    <main class="container mx-auto px-4">
        <div class="grid grid-cols-1 max-w-md mx-auto">
            <!-- Header -->
            <div class="col-span-1 text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">Entrar na Conta</h1>
            </div>

            <!-- Formulário com Scroll -->
            <div class="col-span-1">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <form class="space-y-6 p-6">
                        <!-- Campo Email -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700">
                                Endereço de Email
                            </label>
                            <div class="relative">
                                <input 
                                    v-model="formdata.email"
                                    type="email" 
                                    placeholder="seu@email.com"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white pl-11"
                                />
                                <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Icon name="mdi:email" class="text-xl" />
                                </div>
                            </div>
                        </div>

                        <!-- Botões de Ação -->
                        <div class="space-y-4">
                            <div class="flex gap-3">
                                <button
                                    @click.prevent="send"
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    <Icon name="mdi:lock-reset" class="text-lg" />
                                    <span>Redefinir Senha</span>
                                </button>
                                <button
                                    @click.prevent="next"
                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    <Icon name="mdi:login" class="text-lg" />
                                    <span>Entrar</span>
                                </button>
                            </div>

                            <!-- Cadastro -->
                            <div class="pt-4 border-t border-gray-200">
                                <button
                                    @click.prevent="goRouter()"
                                    class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    <Icon name="mdi:account-plus" class="text-lg" />
                                    <span>Cadastrar-me</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>
    <LoginModal v-model="isLoginModal" :email="formdata.email" />
</template>

<style scoped>
/* Scrollbar customizada para o formulário */
.max-h-\[70vh\]::-webkit-scrollbar {
    width: 6px;
}

.max-h-\[70vh\]::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.max-h-\[70vh\]::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.max-h-\[70vh\]::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>