import { collection, getDocs, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase } from '@/composables/useFirebase';
import { useAuthentication } from '../stores/authentication';

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

    return user;
  };

  return { getUser };
};

