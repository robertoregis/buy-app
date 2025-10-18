// server/api/auth/createuser.ts
import { adminAuth } from '../../utils/firebase';

export default defineEventHandler(async (event) => {
  if (event.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body = await readBody(event)
  const { name, email, password } = body

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  try {
    // 1️⃣ Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      disabled: false
    })

    // 4️⃣ Retorna dados
    return {
      success: true,
      uid: userRecord.uid,
      message: 'Usuário criado com sucesso'
    }

  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
