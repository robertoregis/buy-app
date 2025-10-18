// composables/useFirebaseAuth.ts
import { useFirebase } from '@/composables/useFirebase'
import { signOut } from 'firebase/auth'
import { useAuthentication } from '@/stores/authentication'
//import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

export const useFirebaseAuth = () => {
  const authentication = useAuthentication()
  const toast = useToast()
  const router = useRouter()
  const { firestore, auth } = useFirebase()

  const getCurrentUser = () => auth.currentUser

  const getUserClaims = async () => {
    const user = getCurrentUser()
    if (!user) return null
    return await user.getIdTokenResult()
  }

  const checkExpiration = async (claims: any, userData: any, signOutCallback?: () => void) => {
    const dateToken = new Date(claims.dateLogin)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateToken < yesterday) {
      await signOut(auth)
      //toast.error('O teu tempo expirou. Logue novamente')
      signOutCallback?.()
      router.push('/')
      //authentication.setIsAuthSuccess(false)
      return true
    }
    return false
  }

  return {
    getCurrentUser,
    getUserClaims,
    checkExpiration,
  }
}
