<script lang="ts">
  import { ref, defineComponent, watch } from 'vue';
  import { vMaska } from "maska/vue";
  import { useFirebase } from '@/composables/useFirebase';
  import { increment, limit, getDoc, 
      doc, updateDoc, Timestamp, orderBy
  } from 'firebase/firestore';
  import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
  import { useProfile } from '../composables/useProfile';
  import { updateLogin } from '../composables/firebaseDocs';

  export default defineComponent({
    name: 'LoginModal',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
      closeOnBackdrop: {
        type: Boolean,
        required: false,
        default: true,
      },
      email: {
        type: String,
        required: false
      }
    },
    directives: {
      maska: vMaska, // 👈 registra a diretiva
    },
    emits: ['update:modelValue', 'closed'],
    setup(props, { emit }) {
      const { firestore } = useFirebase()
      const isOpen = ref(props.modelValue);
      const formdata = ref<any>({
        email: null,
        password: null
      })
      const { notify } = useNotification();
      const { fetchProfile } = useProfile()
      const isShowPassword = ref<boolean>(false)
      const router = useRouter();
      const closeModal = () => {
        isOpen.value = false;
        emit('update:modelValue', false);
        emit('closed');
      };

      // Acompanhar se o estado do modal for alterado fora
      watch(() => props.modelValue, (newVal) => {
        isOpen.value = newVal;
      });
      watch(() => props.email, (newVal) => {
        formdata.value.email = newVal;
      })

      const loginWithPassword = async () => {
        if(!formdata.value.email) {
          notify({
            text: "Informe o email",
            type: "error",
          });
          return
        }
        if(!formdata.value.password) {
          notify({
            text: "Informe a senha",
            type: "error",
          });
          return
        }
        try {
          const auth: any = getAuth()
          const userCredential = await signInWithEmailAndPassword(auth, formdata.value.email, formdata.value.password)
          const user = userCredential.user

          // Aqui você chama a função do composable que busca profile, Fresh, Dashboard, etc
          const { profile, data }: any = await fetchProfile(user.uid)
          if(!profile) {
            notify({
              text: "Alguns dos seus dados estão errado, tente novamente!",
              type: "error",
            });
          }
          let dateTimestamp = Timestamp.fromDate(new Date())
          const userRef = doc(firestore, "Users", data.id);
          router.push('/conta/grupos')
          setTimeout(() => {
              notify({
                text: "O login foi feito com sucesso. Seja bem vindo!",
                type: "success",
              });
          }, 1000)
        } catch (error: any) {
          console.log(error)
        }
      }

      const goRouter = () => {
        router.push(`/conta/grupos`)
      }

      // Fechar se o usuário clicar fora do modal (em um fundo opaco)
      const handleBackdropClick = (e: MouseEvent) => {
        if (props.closeOnBackdrop && e.target === e.currentTarget) {
          closeModal();
        }
      };

      return {
        isOpen,
        closeModal,
        handleBackdropClick,
        formdata,
        goRouter,
        isShowPassword,
        loginWithPassword,
        props
      };
    },
  });
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex justify-center items-center"
    @click="handleBackdropClick"
  >
    <div
      class="w-[600px] bg-white rounded-lg shadow-lg p-[30px] relative max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Cabeçalho do modal -->
      <div class="text-xl font-semibold mb-4">Digite a sua senha</div>

      <!-- Conteúdo rolável do modal -->
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols p-10">
          <div class="col-span-1">
            <form action="" class="grid grid-cols">
                <div class="col-span-1">
                    <div class="flex flex-col relative mt-1">
                        <label v-if="formdata.password" class="absolute top-[-11px] left-[5px] text-gray-500" for="" style="z-index: 100;">Senha:</label>
                       <div class="relative">
                        <input v-model="formdata.password" :type="isShowPassword ? 'text' : 'password'" name="" id="" placeholder="Senha" class="w-full mt-1 border-2 border-gray-200 rounded bg-gray-200 py-1 pl-2 pr-1">
                        <button @click="isShowPassword = !isShowPassword" type="button" class="cursor-pointer absolute position-center-y right-[5px] p-0 "><Icon :name="isShowPassword ? 'material-symbols:visibility-lock-rounded' : 'material-symbols:visibility-rounded'" class="align-middle text-xl" /></button>
                       </div>
                    </div>
                </div>
                <div class="col-span-1 mt-4">
                    <div class="flex justify-center mt-2">
                        <Button @click.prevent.stop="loginWithPassword" label="Confirmar" color="bg-orange-600" />
                    </div>
                </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Botão de Fechar -->
      <button
        class="cursor-pointer absolute top-[10px] right-[10px] text-gray-600 hover:text-gray-900"
        @click="closeModal"
      >
			<Icon name="mdi:close" class="text-xl" />
		</button>
    </div>
  </div>
</template>

<style scoped>
/* Animação suave */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

div[v-cloak] {
  display: none;
}

div.fixed {
  animation: fadeIn 0.3s ease-in-out;
}
</style>