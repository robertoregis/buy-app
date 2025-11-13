<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex justify-center items-center p-4"
    @click="handleBackdropClick"
  >
    <div
      class="w-full max-w-md bg-white rounded-2xl shadow-xl relative overflow-hidden border border-gray-200"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
        <h1 class="text-xl font-bold text-white mb-1">Confirmar Acesso</h1>
      </div>

      <!-- Form -->
      <div class="p-6">
        <form class="space-y-5" @submit.prevent="loginWithPassword">
          <!-- Email (readonly) -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Email
            </label>
            <div class="relative">
              <input 
                v-model="formdata.email"
                type="email" 
                readonly
                class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed pl-11"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Icon name="mdi:email" class="text-xl" />
              </div>
            </div>
          </div>

          <!-- Senha -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Senha
            </label>
            <div class="relative">
              <input 
                v-model="formdata.password"
                :type="isShowPassword ? 'text' : 'password'"
                placeholder="Digite sua senha"
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
          </div>

          <!-- Botão Confirmar -->
          <button
            type="submit"
            class="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95"
          >
            <Icon name="mdi:check" class="text-lg" />
            <span>Confirmar</span>
          </button>
        </form>

        <!-- Link para recuperar senha -->
        <div class="mt-4 text-center">
          <a href="#" class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            Esqueceu sua senha?
          </a>
        </div>
      </div>

      <!-- Botão Fechar -->
      <button
        class="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        @click="closeModal"
      >
        <Icon name="mdi:close" class="text-xl" />
      </button>
    </div>
  </div>
</template>

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
    maska: vMaska,
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

<style scoped>
@keyframes fadeIn {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

div.fixed {
  animation: fadeIn 0.3s ease-in-out;
}

input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>