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
    const isLoginModal = ref<boolean>(false);
    const formdata = ref<any>({
        email: null,
        password: null,
        name: null
    })
    const { notify } = useNotification();
    const isShowPassword = ref<boolean>(false)
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
        }
    }
    const goRouter = () => {
        router.push(`/`)
    }
</script>
<template>
    <main class="container">
        <div class="grid grid-cols">
            <div class="col-span-1">
                <h1>Efetuar o login</h1>
            </div>
            <div class="col-span-1 mt-4">
                <form action="" class="grid grid-cols">
                    <div class="col-span-1">
                        <div class="flex flex-col relative mt-1">
                            <label v-if="formdata.name" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Nome:</label>
                            <input v-model="formdata.name" type="text" name="" id="" placeholder="Nome" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                        </div>
                        <div class="flex flex-col relative mt-3">
                            <label v-if="formdata.email" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">E-mail:</label>
                            <input v-model="formdata.email" type="email" name="" id="" placeholder="E-mail" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                        </div>
                        <div class="flex flex-col relative mt-3">
                            <label v-if="formdata.password" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Senha:</label>
                        <div class="relative">
                            <input v-model="formdata.password" :type="isShowPassword ? 'text' : 'password'" name="" id="" placeholder="Senha" class="w-full mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                            <button @click="isShowPassword = !isShowPassword" type="button" class="cursor-pointer absolute position-center-y right-[5px] p-0 "><Icon :name="isShowPassword ? 'material-symbols:visibility-lock-rounded' : 'material-symbols:visibility-rounded'" class="align-middle text-xl" /></button>
                        </div>
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="flex items-center justify-end">
                            <Button @click.prevent="createUser" label="Criar" color="bg-green-700" />
                        </div>
                        <div class="flex justify-center mt-2">
                            <Button @click.prevent="goRouter" label="Login" :isFlat="false" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </main>
    <LoginModal v-model="isLoginModal" />
</template>