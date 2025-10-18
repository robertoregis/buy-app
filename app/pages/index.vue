<script setup lang="ts">
    const router = useRouter()
    const isLoginModal = ref<boolean>(false)
    const formdata = ref<any>({
        email: null,
        password: null
    })
    const send = () => {
        alert(`kkkk`)
    }
    const goRouter = () => {
        router.push(`/cadastrar`)
    }
    const next = () => {
        if(!formdata.value.email) {
            alert('Informe o email')
            return
        }
        isLoginModal.value = true;
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
                            <label v-if="formdata.email" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">E-mail:</label>
                            <input v-model="formdata.email" type="email" name="" id="" placeholder="E-mail" class="mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="flex items-center justify-end">
                            <Button @click.prevent="send" label="Redefinir senha" color="bg-gray-600" class="mr-3" />
                            <Button @click.prevent="next" label="Entrar" color="bg-green-700" />
                        </div>
                        <div class="flex justify-center mt-2">
                            <Button @click.prevent="goRouter()" label="Cadastrar-me" :isFlat="false" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </main>
    <LoginModal v-model="isLoginModal" :email="formdata.email" />
</template>