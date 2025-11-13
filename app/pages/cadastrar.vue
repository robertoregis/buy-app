<script setup lang="ts">
    // fazer a autenticação com o firebase
    import { getAuth,
        createUserWithEmailAndPassword, signOut } from "firebase/auth";
    // para usar o firebase
    import { useFirebase } from '@/composables/useFirebase';
    import { collection, doc, updateDoc, Timestamp, addDoc, setDoc
    } from 'firebase/firestore';
    const { firestore } = useFirebase();
    const router = useRouter();
    const formdata = ref<any>({
        email: null,
        password: null,
        name: null
    })
    const { notify } = useNotification();
    const isShowPassword = ref<boolean>(false)
    const isLoading = ref(false)
    
    const createUser = async () => {
        if(!formdata.value.name) {
            notify({
                text: "Precisa do nome",
                type: "error",
            });
            return
        }
        if(!formdata.value.email) {
            notify({
                text: "Precisa do email",
                type: "error",
            });
            return
        }
        if(!formdata.value.password) {
            notify({
                text: "Precisa da senha",
                type: "error",
            });
            return
        } else {
            if(formdata.value.password.length < 6) {
                notify({
                    text: "A senha precisa ter no mínimo 6 caracteres",
                    type: "error",
                });
                return
            }
        }
        
        isLoading.value = true
        
        try {
            const auth: any = getAuth()
            let dateTimestamp = Timestamp.fromDate(new Date())

            // 1. Cria a conta E FAZ O LOGIN automaticamente
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formdata.value.email,
                formdata.value.password
            );

            // 2. Cria os documentos no Firestore
            await setDoc(doc(firestore, "Profiles", userCredential.user.uid), {
                name: formdata.value.name,
                email: formdata.value.email,
                created_at: dateTimestamp,
                updated_at: dateTimestamp,
                type: null
            })

            const userCreated = await addDoc(collection(firestore,"Users"), {
                name: formdata.value.name,
                email: formdata.value.email,
                created_at: dateTimestamp,
                updated_at: dateTimestamp,
                type: null,
                profile_id: userCredential.user.uid,
                friends: []
            })

            if(userCreated.id) {
                // 3. DESLOGA O USUÁRIO IMEDIATAMENTE!
                await signOut(auth); // <--- A linha mágica ✨
                
                notify({
                    text: "Usuário criado com sucesso. Por favor, faça o login.",
                    type: "success",
                });
                
                // 4. Limpa o formulário
                formdata.value = {
                    email: null,
                    password: null,
                    name: null
                }

                // 5. Redireciona para a tela de Login (se necessário)
                router.push(`/`); // Se a sua tela de login for a rota '/'
            }
        } catch(error) {
            console.log(error)
            notify({
                text: "Erro ao criar usuário. Tente novamente.",
                type: "error",
            });
        } finally {
            isLoading.value = false
        }
    }
    const goRouter = () => {
        router.push(`/`)
    }
</script>

<template>
    <main class="container mx-auto px-4">
        <div class="grid grid-cols-1 max-w-md mx-auto">
            <!-- Header -->
            <div class="col-span-1 text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">Criar Conta</h1>
                <p class="text-gray-600">Preencha seus dados para se cadastrar</p>
            </div>

            <!-- Formulário -->
            <div class="col-span-1">
                <form class="space-y-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <!-- Campo Nome -->
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700">
                            Nome Completo
                        </label>
                        <div class="relative">
                            <input 
                                v-model="formdata.name"
                                type="text" 
                                placeholder="Seu nome completo"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white pl-11"
                            />
                            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Icon name="mdi:account" class="text-xl" />
                            </div>
                        </div>
                    </div>

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

                    <!-- Campo Senha -->
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700">
                            Senha
                        </label>
                        <div class="relative">
                            <input 
                                v-model="formdata.password"
                                :type="isShowPassword ? 'text' : 'password'"
                                placeholder="Sua senha"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white pl-11 pr-11"
                            />
                            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Icon name="mdi:lock" class="text-xl" />
                            </div>
                            <button 
                                @click.prevent="isShowPassword = !isShowPassword" 
                                type="button" 
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Icon :name="isShowPassword ? 'mdi:eye-off' : 'mdi:eye'" class="text-xl" />
                            </button>
                        </div>
                        <p class="text-xs text-gray-500">
                            A senha deve ter pelo menos 6 caracteres
                        </p>
                    </div>

                    <!-- Botões de Ação -->
                    <div class="space-y-4">
                        <button
                            @click.prevent="createUser"
                            :disabled="isLoading"
                            :class="[
                                'w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2',
                                isLoading 
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                            ]"
                        >
                            <Icon v-if="isLoading" name="mdi:loading" class="animate-spin text-lg" />
                            <Icon v-else name="mdi:account-plus" class="text-lg" />
                            <span>{{ isLoading ? 'Criando conta...' : 'Criar Conta' }}</span>
                        </button>

                        <!-- Login -->
                        <div class="pt-4 border-t border-gray-200">
                            <button
                                @click.prevent="goRouter"
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                                <Icon name="mdi:login" class="text-lg" />
                                <span>Fazer Login</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </main>
</template>