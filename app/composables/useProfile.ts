// composables/useProfile.ts
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore'
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
    let friends = []
    // Query para buscar os dados
    const q = query(
    collection(firestore, "Friendships"),
        where("is_active", "==", true),
        where('friends', 'array-contains', authentication.userId),
        orderBy("created_at", "desc"),
    )
    const querySnapshot = await getDocs(q)
    friends = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    authentication.setFriends(friends)

    return {
      profile: profileData,
      data: data
    }
  }

  return {
    fetchProfile
  }
}
