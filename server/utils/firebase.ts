// server/utils/firebase.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const config = useRuntimeConfig()

// Evitar reinicializar o app em hot-reload
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: config.public.PROJECT_ID_FIREBASE as string,
      clientEmail: config.FIREBASE_CLIENT_EMAIL as string,
      privateKey: (config.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    }),
    storageBucket: config.public.STORAGE_BUCKET_FIREBASE as string,
  })
}

export const adminAuth = getAuth()
export const adminFirestore = getFirestore()
export const adminStorage = getStorage()
