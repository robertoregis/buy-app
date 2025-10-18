  import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, where, query, increment } from "firebase/firestore";
  import { useFirebase } from '@/composables/useFirebase';
  // ========================
  // Users
  // ========================

  // Criar um usuário
  export const createUser = async (data: {
    name: string
    email: string
  }) => {
    const { firestore } = useFirebase();
    const now = new Date()

    const userRef = await addDoc(collection(firestore, "Users"), {
      name: data.name,
      email: data.email,
      image_url: "https://firebasestorage.googleapis.com/v0/b/buy-app-8c9ec.firebasestorage.app/o/avatar.png?alt=media&token=ae2cef95-b633-491a-9394-4723e541e8e2",
      friends: [],
      friend_requests_sent: [],
      friend_requests_received: [],
      created_at: now,
      updated_at: now,
      last_login: null
    })

    return userRef.id
  }

  // ========================
  // Groups
  // ========================

  // Criar um grupo
  export const createGroup = async (data: {
    name: string
    description?: string
    owner_id: string
    members?: string[]
  }) => {
    const { firestore } = useFirebase();
    const now = new Date()

    const groupRef = await addDoc(collection(firestore, "Groups"), {
      name: data.name,
      description: data.description ?? null,
      owner_id: data.owner_id,
      members: data.members ?? [],
      is_active: true,
      is_closed: false,
      created_at: now,
      updated_at: now,
    })

    return groupRef.id
  }

  // ========================
  // Purchases
  // ========================

  // Criar uma purchase dentro de um grupo
  export const createPurchase = async (
    groupId: string,
    data: {
      name: string
      description?: string
      version: string,
      planned_date: string,
      code: string,
      is_everyone_allowed?: boolean
    }
  ) => {
    const { firestore } = useFirebase();
    const now = new Date()

    const purchaseRef = await addDoc(
      collection(firestore, "Groups", groupId, "Purchases"),
      {
        name: data.name,
        description: data.description ?? null,
        version: data.version,
        status: "planned",
        code: data.code,
        purchase_final_id: null,
        purchase_planned_id: null,
        is_closed: false,
        final_price: 0,
        final_price_formatted: "R$ 0",
        final_amount: 0,
        price_planned: 0,
        price_final: 0,
        price_planned_formatted: "R$ 0",
        price_final_formatted: "R$ 0",
        amount_planned: 0,
        amount_final: 0,
        is_in_progress: false,
        active_participants: [],
        allow_only_creator_to_remove: true,
        planned_date: data.planned_date,
        execute_date: null,
        is_active: true,
        is_execute: false,
        created_at: now,
        updated_at: now,
        is_everyone_allowed: data.is_everyone_allowed ?? true
      }
    )

    if(purchaseRef.id) {
      const purchasePlanned = await addDoc(collection(firestore, "Groups", groupId, "Purchases", purchaseRef.id, "Models"), {
        name: data.name,
        description: data.description ?? null,
        version: data.version,
        type: 'planned',
        code: data.code,
        is_closed: false,
        is_active: true,
        is_execute: false,
        final_price: 0,
        final_price_formatted: "R$ 0",
        final_amount: 0,
        created_at: now,
        updated_at: now
      })
      const purchaseFinal = await addDoc(collection(firestore, "Groups", groupId, "Purchases", purchaseRef.id, "Models"), {
        name: data.name,
        description: data.description ?? null,
        version: data.version,
        type: 'final',
        code: data.code,
        is_closed: false,
        is_active: true,
        is_execute: false,
        final_price: 0,
        final_price_formatted: "R$ 0",
        final_amount: 0,
        created_at: now,
        updated_at: now
      })
      const purchaseGeral = await addDoc(collection(firestore, "Purchases"), {
        name: data.name,
        description: data.description ?? null,
        version: data.version,
        is_closed: false,
        is_active: true,
        is_execute: false,
        group_id: groupId,
        purchase_id: purchaseRef.id,
        created_at: now,
        updated_at: now
      })
      const itemCollection = collection(
        firestore,
        "Groups",
        groupId,
        "Purchases",
      )
      const purchaseRefDoc = doc(itemCollection, purchaseRef.id)
      await updateDoc(purchaseRefDoc, {
        purchase_final_id: purchaseFinal.id,
        purchase_planned_id: purchasePlanned.id
      })
    }

    return purchaseRef.id
  }

  // ========================
  // Items
  // ========================

  // Criar ou atualizar item dentro de uma purchase
  export const saveItem = async (
    groupId: string,
    purchaseId: string,
    purchasePlannedId: string,
    data: {
      id?: string // ← se vier, edita; se não vier, cria
      name: string
      price: number
      amount: number
      created_by: string
    }
  ) => {
    const { firestore } = useFirebase()
    const now = new Date()
    const priceFormatted = `R$ ${data.price.toFixed(2).replace(".", ",")}`

    // caminho base
    const itemCollection = collection(
      firestore,
      "Groups",
      groupId,
      "Purchases",
      purchaseId,
      "Models",
      purchasePlannedId,
      "Items"
    )

    if (data.id) {
      // Atualizar item existente
      const itemRef = doc(itemCollection, data.id)
      await updateDoc(itemRef, {
        name: data.name,
        price: data.price,
        price_formatted: priceFormatted,
        amount: data.amount,
        updated_at: now
      })
      return data.id
    } else {
      // Criar novo item
      const itemRef = await addDoc(itemCollection, {
        name: data.name,
        price: data.price,
        price_formatted: priceFormatted,
        amount: data.amount,
        created_by: data.created_by,
        created_at: now,
        updated_at: now
      })
      return itemRef.id
    }
  }

  // Deletar item de uma purchase
  export const deleteItem = async (
    groupId: string,
    purchaseId: string,
    purchaseModelId: string,
    itemId: string
  ) => {
    const { firestore } = useFirebase()

    const itemRef = doc(
      firestore,
      "Groups",
      groupId,
      "Purchases",
      purchaseId,
      "Models",
      purchaseModelId,
      "Items",
      itemId
    )

    await deleteDoc(itemRef)
  }

  export const initExecutePurchase = async (
    groupId: string,
    purchaseId: string,
    plannedPurchaseId: string,
    finalPurchaseId: string
  ) => {
    const { firestore } = useFirebase()
    const now = new Date()

    const purchasesCollection = collection(firestore, "Groups", groupId, "Purchases")
    const modelsCollection = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models")

    // 1️⃣ Referências das duas compras
    const purchaseRef = doc(purchasesCollection, purchaseId)
    const plannedRef = doc(modelsCollection, plannedPurchaseId)
    const finalRef = doc(modelsCollection, finalPurchaseId)

    // 2️⃣ Atualiza ambas para marcar como executadas
    await Promise.all([
      updateDoc(purchaseRef, { is_execute: true, updated_at: now }),
      updateDoc(plannedRef, { is_execute: true, updated_at: now }),
      updateDoc(finalRef, { is_execute: true, updated_at: now }),
    ])

    // 3️⃣ Busca os itens da compra planejada
    const plannedItemsRef = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models", plannedPurchaseId, "Items")
    const plannedItemsSnapshot = await getDocs(plannedItemsRef)

    if (plannedItemsSnapshot.empty) {
      console.log("Nenhum item encontrado na compra planejada.")
      return
    }

    // 4️⃣ Copia os itens para a compra final
    const finalItemsRef = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models", finalPurchaseId, "Items")

    const promises = plannedItemsSnapshot.docs.map(async (itemDoc) => {
      const itemData = itemDoc.data()
      await addDoc(finalItemsRef, {
        ...itemData,
        created_at: now,
        updated_at: now,
      })
    })

    await Promise.all(promises)

    console.log("✅ Compra executada com sucesso! Itens copiados para a versão final.")
  }

  export const finishedPurchase = async (
    groupId: string,
    purchaseId: string,
    finalPurchaseId: string,
    plannedPurchaseId: string,
    amount: number,
    price: number
  ) => {
    const { firestore } = useFirebase()
    const now = new Date()

    const purchasesCollection = collection(firestore, "Groups", groupId, "Purchases")
    const modelsCollection = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models")

    // 1️⃣ Referências das duas compras
    const purchaseRef = doc(purchasesCollection, purchaseId)
    const plannedRef = doc(modelsCollection, plannedPurchaseId)
    const finalRef = doc(modelsCollection, finalPurchaseId)
    const priceFormatted = `R$ ${price.toFixed(2).replace(".", ",")}`
    // 2️⃣ Atualiza ambas para marcar como finalizadas
    await Promise.all([
      updateDoc(plannedRef, { is_in_progress: true, is_closed: true, updated_at: now }),
      updateDoc(finalRef, { is_in_progress: true, is_closed: true, updated_at: now, final_price: price, final_amount: amount, final_price_formatted: priceFormatted }),
      updateDoc(purchaseRef, { 
        is_in_progress: true,
        is_closed: true,
        updated_at: now,
        final_price: price,
        final_amount: amount,
        final_price_formatted: priceFormatted
      }),
    ])

    console.log("✅ Compra finalizada com sucesso!")
  }

  export const plannedPurchase = async (
    groupId: string,
    purchaseId: string,
    plannedPurchaseId: string,
    amount: number,
    price: number
  ) => {
    const { firestore } = useFirebase()
    const now = new Date()

    const groupsCollection = collection(firestore, "Groups")
    const purchasesCollection = collection(firestore, "Groups", groupId, "Purchases")
    const purchasesPlannedCollection = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models")

    // 1️⃣ Referências das duas compras
    const groupRef = doc(groupsCollection, groupId)
    const purchaseRef = doc(purchasesCollection, purchaseId)
    const plannedRef = doc(purchasesPlannedCollection, plannedPurchaseId)
    const priceFormatted = `R$ ${price.toFixed(2).replace(".", ",")}`
    // 2️⃣ Atualiza ambas para marcar como finalizadas
    await Promise.all([
      updateDoc(plannedRef, { final_price: price, final_amount: amount, final_price_formatted: priceFormatted, updated_at: now }),
      updateDoc(purchaseRef, { 
        final_price: price, 
        final_amount: amount, 
        final_price_formatted: priceFormatted,
        price_planned: price,
        amount_planned: amount,
        price_planned_formatted: priceFormatted,
        is_in_progress: true,
        updated_at: now
      }),
    ])

    console.log("✅ Compra planejada com sucesso!")
  }

  // Criar um participante dentro de uma empresa
  export const createParticipantInPurchase = async (
    groupId: string,
    purchaseId: string,
    user: {
      id: string,
      name: string,
      email: string
    }
  ) => {
    const { firestore } = useFirebase();
    const now = new Date()

    const participantPurchaseRef = await addDoc(
      collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Participants"),
      {
        name: user.name,
        email: user.email,
        user_id: user.id,
        status: "",
        is_closed: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      }
    )

    return participantPurchaseRef.id
  }

  export const createParticipantInGroup = async (
    groupId: string,
    user: {
      id: string,
      name: string,
      email: string
    }
  ) => {
    const { firestore } = useFirebase();
    const now = new Date()

    const participantGroupRef = await addDoc(
      collection(firestore, "Groups", groupId, "Participants"),
      {
        name: user.name,
        email: user.email,
        user_id: user.id,
        status: "",
        is_closed: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      }
    )

    return participantGroupRef.id
  }