// composables/useProfile.ts
import { doc, getDoc } from 'firebase/firestore'
import { useFirebase } from '@/composables/useFirebase'
import { useAuthentication } from '@/stores/authentication'
/*import { useToast } from 'vue-toastification'*/
import { useUserData } from './useUserData';
import { useRouter } from 'vue-router';

export const useProfile = () => {
  const { firestore } = useFirebase()
  const authentication = useAuthentication()
  //const toast = useToast()
  const router = useRouter()
  const { getUser } = useUserData()

  const fetchProfile = async (uid: string, groupId?: any) => {
    const profileRef = doc(firestore, 'Profiles', uid)
    const profileSnap = await getDoc(profileRef)
    if (!profileSnap.exists()) {
      router.push('/')
      return null
    }
    const profileData = { id: profileSnap.id, ...profileSnap.data() }
    let data: any
    const user = await getUser(profileSnap.id)
    authentication.setUserId(user.id)
    authentication.setUser(user)
    data = user
    authentication.setProfile(profileData)
    authentication.setProfileId(uid)
    if(groupId) {
      const groupRef = doc(firestore, "Groups", groupId);
      const groupSnap = await getDoc(groupRef)
      if(groupSnap.exists()) {
        const groupData = { id: groupSnap.id, ...groupSnap.data() }
        authentication.setGroup(groupData)
      }
    }

    return {
      profile: profileData,
      data: data
    }
  }

  return {
    fetchProfile
  }
}
