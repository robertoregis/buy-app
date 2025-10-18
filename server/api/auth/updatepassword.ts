// server/api/auth/updatePassword.ts
import { adminAuth } from '../../utils/firebase';

export default defineEventHandler(async (event) => {
  if (event.req.method !== 'PATCH') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body = await readBody(event)
  const { uid, new_password } = body

  if (!uid || !new_password) {
    throw createError({ statusCode: 400, statusMessage: 'UID and newPassword are required' })
  }

  try {
    // Atualiza a senha do usuário
    await adminAuth.updateUser(uid, {
      password: new_password
    })

    return {
      success: true,
      message: 'Senha atualizada com sucesso'
    }
  } catch (err: any) {
    return {
        success: false,
        message: err.message
    }
    //throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
