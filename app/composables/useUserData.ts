import { collection, getDocs, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase } from '@/composables/useFirebase';
import { useAuthentication } from '../stores/authentication';
import { updateLogin } from '../composables/firebaseDocs';
import { isLoginOlderThanOneDay } from '../composables/convert';

export const useUserData = () => {
  const { firestore } = useFirebase();
  const authentication = useAuthentication();

  const getUser = async (profileId: string) => {
    const q = query(collection(firestore, 'Users'), where('profile_id', '==', profileId));
    const snapshot = await getDocs(q);

    let user: any;
    snapshot.forEach(docItem => {
      user = { id: docItem.id, ...docItem.data() };
    });

    if (!user) {
      console.warn(`Usuário com profile_id ${profileId} não encontrado.`);
      return null;
    }
    
    if (isLoginOlderThanOneDay(user.last_login?.toDate())) {
      await updateLogin(user.id);

      const docRef = doc(firestore, 'Users', user.id);
      const updatedSnapshot = await getDoc(docRef);
      
      if (updatedSnapshot.exists()) {
        return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
      }
    }

    return user;
  };

  return { getUser };
};

