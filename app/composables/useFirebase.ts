// composables/useFirebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { useRuntimeConfig } from '#app'

export const useFirebase = () => {
    // Chamada dentro da função, segura para Nuxt 3
    const config = useRuntimeConfig()

    const firebaseConfig = {
        apiKey: config.public.API_KEY_FIREBASE as string,
        authDomain: config.public.AUTH_DOMAIN_FIREBASE as string,
        projectId: config.public.PROJECT_ID_FIREBASE as string,
        storageBucket: config.public.STORAGE_BUCKET_FIREBASE as string,
        messagingSenderId: config.public.MESSAGING_SENDER_ID_FIREBASE as string,
        appId: config.public.APP_ID_FIREBASE as string,
        measurementId: config.public.MEASUREMENT_ID_FIREBASE as string
    }

    const app = initializeApp(firebaseConfig)

    const auth = getAuth(app)
    const firestore = getFirestore(app)
    const database = getDatabase(app)
    const storage = getStorage(app)

    return { auth, firestore, database, storage }
}
