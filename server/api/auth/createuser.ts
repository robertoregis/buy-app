// server/api/auth/createuser.ts
import { adminFirestore } from '../../utils/firebase';

export default defineEventHandler(async (event) => {
  if (event.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body = await readBody(event)
  const { uid, name, email, type } = body

  if (!uid || !name || !email || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const now = new Date()

  try {
    // 1️⃣ Criar Profile
    const profileRef = adminFirestore.collection('Profiles').doc(uid)
    const profileData = {
      name,
      email,
      type,
      created_at: now,
      updated_at: now
    }
    await profileRef.set(profileData)

    // 2️⃣ Criar registro relacionado baseado no type
    let relatedData: any = null

    /*if (type === 'company') {
      const companyRef = adminFirestore.collection('Companies').doc()
      relatedData = {
        id: companyRef.id,
        name,
        email,
        profile_id: uid,
        created_at: now,
        updated_at: now
      }
      await companyRef.set(relatedData)
    }
    else if (type === 'ambassador') {
      const userRef = adminFirestore.collection('Users').doc()
      relatedData = {
        id: userRef.id,
        name,
        email,
        profile_id: uid,
        created_at: now,
        updated_at: now
      }
      await userRef.set(relatedData)
    }
    else if (type === 'collaborator') {
      const collabRef = adminFirestore.collection('Collaborators').doc()
      relatedData = {
        id: collabRef.id,
        name,
        email,
        profile_id: uid,
        created_at: now,
        updated_at: now
      }
      await collabRef.set(relatedData)
    }

    // 3️⃣ Retornar dados criados
    return {
      profile: profileData,
      related: relatedData
    }*/

      return {
        ...profileData,
        uid
      };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
