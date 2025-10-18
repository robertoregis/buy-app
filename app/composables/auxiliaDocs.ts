import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore"
//import { firestore } from "../composables/useFirebase"

// ========================
// Purchases auxiliares
// ========================

// Iniciar compra (set is_in_progress true e adicionar participante)
export const startPurchase = async (groupId: string, purchaseId: string, userId: string) => {
  const purchaseRef = doc(firestore, "Groups", groupId, "Purchases", purchaseId)

  await updateDoc(purchaseRef, {
    is_in_progress: true,
    active_participants: arrayUnion(userId)
  })
}

// Sair da compra (remover participante e atualizar is_in_progress)
export const leavePurchase = async (groupId: string, purchaseId: string, userId: string) => {
  const purchaseRef = doc(firestore, "Groups", groupId, "Purchases", purchaseId)

  await updateDoc(purchaseRef, {
    active_participants: arrayRemove(userId)
  })

  // Opcional: se não houver mais participantes, marcar is_in_progress como false
  // Para isso, precisa ler o documento
  // const snap = await getDoc(purchaseRef)
  // const participants = snap.data()?.active_participants ?? []
  // if (participants.length === 0) {
  //   await updateDoc(purchaseRef, { is_in_progress: false })
  // }
}

// Atualizar campos da compra (ex: status, preço final)
export const updatePurchase = async (
  groupId: string,
  purchaseId: string,
  data: Partial<{
    status: "open" | "closed"
    final_price: number
    final_price_formatted: string
    final_amount: number
  }>
) => {
  const purchaseRef = doc(firestore, "Groups", groupId, "Purchases", purchaseId)
  await updateDoc(purchaseRef, {
    ...data,
    updated_at: new Date()
  })
}

// ========================
// Items auxiliares
// ========================

// Remover item (só se allow_only_creator_to_remove ou usuário for criador)
export const removeItem = async (
  groupId: string,
  purchaseId: string,
  itemId: string
) => {
  const itemRef = doc(firestore, "Groups", groupId, "Purchases", purchaseId, "Items", itemId)
  await deleteDoc(itemRef)
}

// Atualizar item (ex: quantidade, preço)
export const updateItem = async (
  groupId: string,
  purchaseId: string,
  itemId: string,
  data: Partial<{
    name: string
    price: number
    amount: number
  }>
) => {
  const itemRef = doc(firestore, "Groups", groupId, "Purchases", purchaseId, "Items", itemId)

  const priceFormatted = data.price !== undefined ? `R$ ${data.price.toFixed(2).replace(".", ",")}` : undefined

  await updateDoc(itemRef, {
    ...data,
    ...(priceFormatted ? { price_formatted: priceFormatted } : {})
  })
}

export const updateItem2 = async (
    groupId: string,
    purchaseId: string,
    itemId: string,
    data: {
      name: string
      price: number
      price_formatted: string
      amount: number
    }
  ) => {
    const itemRef = doc(firestore, "Groups", groupId, "Purchases", purchaseId, "Items", itemId)
  
    await updateDoc(itemRef, {
      name: data.name,
      price: data.price,
      price_formatted: data.price_formatted,
      amount: data.amount
    })
  }
  

// Enviar pedido de amizade
export const sendFriendRequest = async (fromId: string, toId: string) => {
    const fromRef = doc(firestore, "Users", fromId)
    const toRef = doc(firestore, "Users", toId)
  
    await updateDoc(fromRef, { friend_requests_sent: arrayUnion(toId) })
    await updateDoc(toRef, { friend_requests_received: arrayUnion(fromId) })
  }
  
  // Aceitar pedido de amizade
  export const acceptFriendRequest = async (userId: string, requesterId: string) => {
    const userRef = doc(firestore, "Users", userId)
    const requesterRef = doc(firestore, "Users", requesterId)
  
    // Remove dos pedidos pendentes
    await updateDoc(userRef, { friend_requests_received: arrayRemove(requesterId) })
    await updateDoc(requesterRef, { friend_requests_sent: arrayRemove(userId) })
  
    // Adiciona nos amigos
    await updateDoc(userRef, { friends: arrayUnion(requesterId) })
    await updateDoc(requesterRef, { friends: arrayUnion(userId) })
  }
  
  // Negar pedido de amizade
  export const denyFriendRequest = async (userId: string, requesterId: string) => {
    const userRef = doc(firestore, "Users", userId)
    const requesterRef = doc(firestore, "Users", requesterId)
  
    // Remove dos pedidos pendentes
    await updateDoc(userRef, { friend_requests_received: arrayRemove(requesterId) })
    await updateDoc(requesterRef, { friend_requests_sent: arrayRemove(userId) })
  }
  