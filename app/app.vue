<script lang="ts">
  import { useFirebaseAuth } from '@/composables/useFirebaseAuth';
  import { useProfile } from '@/composables/useProfile';
  import { useRouter, useRoute } from 'vue-router';
  import { useAuthentication } from '@/stores/authentication';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { useFirebase } from './composables/useFirebase';
  import { useUserData } from './composables/useUserData';
  import {
    signOut
  } from 'firebase/auth';

  export default {
    setup() {
      const { getCurrentUser, getUserClaims, checkExpiration } = useFirebaseAuth()
      const { fetchProfile } = useProfile()
      const { getUser } = useUserData();
      const { auth } = useFirebase();
      const router = useRouter()
      const route = useRoute()
      const authentication = useAuthentication()
      const loading = ref(true)

      const initAuth = async () => {
        //await signOut(auth);
        onAuthStateChanged(auth, async (user) => {
          const group_id = localStorage.getItem('buy_group_id')
          if (!user) {
            router.push('/')
            loading.value = false
            return
          }

          const { claims }: any = await getUserClaims()
          const expired = await checkExpiration(claims, user)
          if (!expired) {
            await fetchProfile(user.uid, group_id).then(async (response) => {
              if (route.path === '/') {
                router.push('/conta/grupos')
              }
            })
            
          }
          loading.value = false
        })
      }

      onMounted(() => {
        initAuth()
      })

      return {
        loading
      }
    }
  }
</script>

<template>
  <div v-if="!loading">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<style>
</style>