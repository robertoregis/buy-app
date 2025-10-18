import { adminAuth } from '../../utils/firebase';

export default defineEventHandler(async (event) => {
  if (event.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body = await readBody(event)
  const { type, uid } = body

  if (!uid || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  try {
    await adminAuth.setCustomUserClaims(uid, {
        type: type,
        dateLogin: new Date().toISOString()
    })
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})