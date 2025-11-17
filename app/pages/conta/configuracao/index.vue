<script setup lang="ts">
    import { useParams } from '../../../stores/params.js';
    import { useAuthentication } from '../../../stores/authentication';
    import { convertDateFirestore } from '../../../composables/convert.js';
    import { updatePassword, getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
    import { updateUser } from '../../../composables/firebaseDocs.js';

    const params = useParams();
    const { notify } = useNotification()
    const authentication: any = useAuthentication();
    definePageMeta({
        layout: 'dashboard'
    })
    
    // Estados reativos
    const formdata = ref({
        name: authentication.user.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    
    const isEditingName = ref(false)
    const isChangingPassword = ref(false)
    const isLoading = ref(false)
    const router = useRouter()

    const updateYourPassword = async () => {
        if (!formdata.value.currentPassword) {
            notify({
                text: 'A senha atual precisa ser informada',
                type: 'error'
            })
            return
        }
        
        if (!formdata.value.newPassword) {
            notify({
                text: 'A nova senha precisa ser informada',
                type: 'error'
            })
            return
        }
        
        if (formdata.value.newPassword !== formdata.value.confirmPassword) {
            notify({
                text: 'As senhas não coincidem',
                type: 'error'
            })
            return
        }
        
        if (formdata.value.newPassword.length < 6) {
            notify({
                text: 'A senha deve ter pelo menos 6 caracteres',
                type: 'error'
            })
            return
        }

        isLoading.value = true
        
        try {
            const auth = getAuth()
            const user = auth.currentUser
            
            if (user && user.email) {
                // Reautenticar o usuário
                const credential = EmailAuthProvider.credential(
                    user.email, 
                    formdata.value.currentPassword
                )
                
                await reauthenticateWithCredential(user, credential)
                
                // Atualizar a senha
                await updatePassword(user, formdata.value.newPassword)
                
                notify({
                    text: 'Senha atualizada com sucesso!',
                    type: 'success'
                })
                
                // Limpar formulário
                formdata.value.currentPassword = ''
                formdata.value.newPassword = ''
                formdata.value.confirmPassword = ''
                isChangingPassword.value = false
            }
        } catch (error: any) {
            console.error("Erro ao atualizar a senha:", error)
            
            if (error.code === 'auth/wrong-password') {
                notify({
                    text: 'Senha atual incorreta',
                    type: 'error'
                })
            } else if (error.code === 'auth/requires-recent-login') {
                notify({
                    text: 'Por favor, faça login novamente para alterar a senha',
                    type: 'error'
                })
            } else {
                notify({
                    text: 'Erro ao atualizar a senha',
                    type: 'error'
                })
            }
        } finally {
            isLoading.value = false
        }
    }

    const updateData = async () => {
        if (!formdata.value.name.trim()) {
            notify({
                text: 'O nome não pode estar vazio',
                type: 'error'
            })
            return
        }

        isLoading.value = true
        
        try {
            await updateUser(authentication.profile.id, authentication.user.id, formdata.value.name.trim())
            
            notify({
                text: 'Dados atualizados com sucesso!',
                type: 'success'
            })
            
            isEditingName.value = false
            // Atualizar o nome no store de autenticação
            authentication.user.name = formdata.value.name
            authentication.profile.name = formdata.value.name
        } catch (error) {
            console.error(error)
            notify({
                text: 'Erro ao atualizar dados',
                type: 'error'
            })
        } finally {
            isLoading.value = false
        }
    }

    const cancelEditName = () => {
        formdata.value.name = authentication.user.name
        isEditingName.value = false
    }

    const cancelChangePassword = () => {
        formdata.value.currentPassword = ''
        formdata.value.newPassword = ''
        formdata.value.confirmPassword = ''
        isChangingPassword.value = false
    }

    onBeforeMount(() => {
        params.changeRouteCurrent('config')
    })
</script>

<template>
    <main class="container mx-auto px-2 lg:px-4 max-w-4xl">
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center space-y-3">
                <h2 class="text-2xl lg:text-3xl font-bold text-gray-800">Configurações</h2>
                <p class="text-gray-600 max-w-2xl mx-auto">
                    Gerencie suas informações pessoais e preferências
                </p>
            </div>

            <!-- Profile Card -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Header do Card -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 border-b border-gray-200">
                    <div class="flex items-center space-x-6">
                        <!-- Avatar -->
                        <div class="relative">
                            <img 
                                :src="authentication.user.image_url || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User'" 
                                :alt="authentication.user.name"
                                class="w-12 h-12 lg:w-20 lg:h-20 rounded-full border-2 lg:border-4 border-white shadow-lg"
                            />
                            <div class="absolute bottom-0 right-0 w-4 h-4 lg:w-5 lg:h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <!-- User Info -->
                        <div class="flex-1">
                            <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ authentication.user.name }}</h1>
                            <p class="text-gray-600 mb-2">{{ authentication.user.email }}</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <div class="flex items-center space-x-1">
                                    <Icon name="mdi:calendar" class="w-4 h-4" />
                                    <span>Último login: {{ convertDateFirestore(authentication.user.last_login) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo das Configurações -->
                <div class="p-6 space-y-8">
                    <!-- Editar Nome -->
                    <div class="space-y-4">
                        <div class="flex flex-col md:flex-row items-start md:items-center md:justify-between space-y-2 md:space-y-0">
                            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                                <Icon name="mdi:account-edit" class="text-blue-600 mr-2 text-xl" />
                                Informações Pessoais
                            </h3>
                            <button
                                v-if="!isEditingName"
                                @click="isEditingName = true"
                                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2"
                            >
                                <Icon name="mdi:pencil" class="text-lg" />
                                <span>Editar Nome</span>
                            </button>
                        </div>

                        <div v-if="!isEditingName" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-600 font-medium">Nome completo</p>
                                    <p class="text-gray-800 font-semibold">{{ authentication.user.name }}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 font-medium">E-mail</p>
                                    <p class="text-gray-800 font-semibold">{{ authentication.user.email }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-else class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-semibold text-gray-700">
                                        Nome completo
                                        <span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input 
                                        v-model="formdata.name"
                                        type="text"
                                        placeholder="Seu nome completo"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    />
                                </div>
                                
                                <div class="flex space-x-3">
                                    <button
                                        @click="updateData"
                                        :disabled="isLoading || !formdata.name.trim()"
                                        :class="[
                                            'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
                                            isLoading || !formdata.name.trim()
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                                        ]"
                                    >
                                        <Icon v-if="isLoading" name="mdi:loading" class="animate-spin text-lg" />
                                        <Icon v-else name="mdi:check" class="text-lg" />
                                        <span>{{ isLoading ? 'Salvando...' : 'Salvar' }}</span>
                                    </button>
                                    
                                    <button
                                        @click="cancelEditName"
                                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Alterar Senha -->
                    <div class="space-y-4">
                        <div class="flex flex-col md:flex-row items-start md:items-center md:justify-between space-y-2 md:space-y-0">
                            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                                <Icon name="mdi:lock-reset" class="text-orange-600 mr-2 text-xl" />
                                Segurança
                            </h3>
                            <button
                                v-if="!isChangingPassword"
                                @click="isChangingPassword = true"
                                class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2"
                            >
                                <Icon name="mdi:key" class="text-lg" />
                                <span>Alterar Senha</span>
                            </button>
                        </div>

                        <div v-if="!isChangingPassword" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p class="text-gray-600 text-sm">
                                Sua senha foi definida quando você criou a conta. 
                                Clique no botão acima para alterá-la.
                            </p>
                        </div>

                        <div v-else class="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-semibold text-gray-700">
                                        Senha Atual
                                        <span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input 
                                        v-model="formdata.currentPassword"
                                        type="password"
                                        placeholder="Digite sua senha atual"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                                    />
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="block text-sm font-semibold text-gray-700">
                                        Nova Senha
                                        <span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input 
                                        v-model="formdata.newPassword"
                                        type="password"
                                        placeholder="Digite a nova senha"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                                    />
                                    <p class="text-xs text-gray-500">
                                        A senha deve ter pelo menos 6 caracteres
                                    </p>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="block text-sm font-semibold text-gray-700">
                                        Confirmar Nova Senha
                                        <span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input 
                                        v-model="formdata.confirmPassword"
                                        type="password"
                                        placeholder="Confirme a nova senha"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                                    />
                                </div>
                                
                                <div class="flex space-x-3">
                                    <button
                                        @click="updateYourPassword"
                                        :disabled="isLoading"
                                        :class="[
                                            'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
                                            isLoading
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                                        ]"
                                    >
                                        <Icon v-if="isLoading" name="mdi:loading" class="animate-spin text-lg" />
                                        <Icon v-else name="mdi:check" class="text-lg" />
                                        <span>{{ isLoading ? 'Alterando...' : 'Alterar Senha' }}</span>
                                    </button>
                                    
                                    <button
                                        @click="cancelChangePassword"
                                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Informações Adicionais -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                            <Icon name="mdi:information" class="text-purple-600 mr-2 text-xl" />
                            Informações da Conta
                        </h3>
                        
                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-600 font-medium">ID do Usuário</p>
                                    <p class="text-gray-800 font-mono text-xs break-all">{{ authentication.user.id }}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 font-medium">Último Acesso</p>
                                    <p class="text-gray-800 font-semibold">{{ convertDateFirestore(authentication.user.last_login) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
