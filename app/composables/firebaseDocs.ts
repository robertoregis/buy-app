  import { collection, addDoc, updateDoc, doc,
    deleteDoc, getDocs, where, query,
    increment, limit, arrayUnion,
    arrayRemove, serverTimestamp
  } from "firebase/firestore";
  import { useFirebase } from '@/composables/useFirebase';
  // ========================
  // Users
  // ========================

  const generateUserPairId = (id1: string, id2: string): string => {
    // Ordena os IDs para garantir que o resultado seja o mesmo,
    // independentemente da ordem de entrada (userFrom/userTo).
    return [id1, id2].sort().join('_');
  };

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
    userId: string,
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
        status: "open",
        status_formatted: "Aberta",
        code: data.code,
        purchase_final_id: null,
        purchase_planned_id: null,
        purchase_geral_id: null,
        is_closed: false,
        final_price: 0,
        final_price_formatted: "R$ 0,00",
        final_amount: 0,
        price_planned: 0,
        price_final: 0,
        price_planned_formatted: "R$ 0,00",
        price_final_formatted: "R$ 0,00",
        amount_planned: 0,
        amount_final: 0,
        is_in_progress: false,
        planning_lock_userId: null,
        planning_lock_expires: null,
        members: [userId],
        user_create_id: userId,
        members_activity: {},
        allow_only_creator_to_remove: true,
        planned_date: data.planned_date,
        execute_date: null,
        init_execute_date: null,
        is_active: true,
        is_execute: false,
        is_planned: false,
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
        members: [userId],
        members_activity: {},
        is_closed: false,
        is_active: true,
        is_execute: false,
        final_price: 0,
        final_price_formatted: "R$ 0,00",
        final_amount: 0,
        created_at: now,
        updated_at: now
      })
      const purchaseFinal = await addDoc(collection(firestore, "Groups", groupId, "Purchases", purchaseRef.id, "Models"), {
        name: data.name,
        description: data.description ?? null,
        version: data.version,
        type: 'final',
        members: [userId],
        members_activity: {},
        code: data.code,
        is_closed: false,
        is_active: true,
        is_execute: false,
        final_price: 0,
        final_price_formatted: "R$ 0,00",
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
        is_in_progress: false,
        is_planned: false,
        members: [userId],
        group_id: groupId,
        purchase_group_id: purchaseRef.id,
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
        purchase_planned_id: purchasePlanned.id,
        purchase_geral_id: purchaseGeral.id
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
  purchasePlannedId: string, // Mantenho este nome, mas ele aponta para o ID do Model 'final'
  data: {
    id?: string // ← se vier, edita; se não vier, cria
    name: string
    price: number
    amount: number
    created_by: string // Adicionado
  }
) => {
  const { firestore } = useFirebase()
  const now = new Date()
  const priceFormatted = `R$ ${data.price.toFixed(2).replace(".", ",")}`

  // caminho base (Compra Executada / final)
  const itemCollection = collection(
    firestore,
    "Groups",
    groupId,
    "Purchases",
    purchaseId,
    "Models",
    purchasePlannedId, // Este é o purchase_final_id
    "Items"
  )

  const itemDataToSave = {
    name: data.name,
    price: data.price,
    price_formatted: priceFormatted,
    amount: data.amount,
    updated_at: now
  }

  if (data.id) {
    // Atualizar item existente
    const itemRef = doc(itemCollection, data.id)
    await updateDoc(itemRef, itemDataToSave)
    return data.id
  } else {
    // Criar novo item
    const itemRef = await addDoc(itemCollection, {
      ...itemDataToSave,
      created_by: data.created_by,
      created_at: now,
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
  finalPurchaseId: string,
  purchaseGeralId: string,
  initiatorUserId: string // Adicionei o ID do iniciador para setar o created_by inicial
) => {
  const { firestore } = useFirebase()
  const now = new Date()

  const purchasesCollection = collection(firestore, "Groups", groupId, "Purchases")
  const modelsCollection = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models")
  const purchaseGeralCollection = collection(firestore, "Purchases")

  // 1️⃣ Referências das duas compras
  const purchaseRef = doc(purchasesCollection, purchaseId)
  const plannedRef = doc(modelsCollection, plannedPurchaseId)
  const finalRef = doc(modelsCollection, finalPurchaseId)
  const purchaseGeralRef = doc(purchaseGeralCollection, purchaseGeralId)

  // 2️⃣ Atualiza ambas para marcar como executadas
  await Promise.all([
    updateDoc(purchaseRef, { is_in_progress: true, updated_at: now, status: "in_execute", status_formatted: "Em execução", init_execute_date: now }),
    updateDoc(plannedRef, { is_in_progress: true, updated_at: now }),
    updateDoc(finalRef, { is_in_progress: true, updated_at: now }),
    updateDoc(purchaseGeralRef, { is_in_progress: true, updated_at: now })
  ])

  // 3️⃣ Busca os itens da compra planejada
  const plannedItemsRef = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models", plannedPurchaseId, "Items")
  const plannedItemsSnapshot = await getDocs(plannedItemsRef)

  if (plannedItemsSnapshot.empty) {
    console.log("Nenhum item encontrado na compra planejada.")
    return
  }

  // 4️⃣ Copia os itens para a compra final (Executada)
  const finalItemsRef = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models", finalPurchaseId, "Items")

  const promises = plannedItemsSnapshot.docs.map(async (itemDoc) => {
    const itemData = itemDoc.data()
    // CRUCIAL: Adiciona o created_by ao item copiado (Será o ID do usuário que INICIOU a execução)
    await addDoc(finalItemsRef, {
      ...itemData,
      created_by: initiatorUserId, // Define o criador inicial
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
  price: number,
  purchaseGeralId: string,
  priceFinalOfPurchase: any
) => {
  const { firestore } = useFirebase()
  const now = new Date()

  const purchasesCollection = collection(firestore, "Groups", groupId, "Purchases")
  const modelsCollection = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models")
  const purchaseGeralCollection = collection(firestore, "Purchases")

  // 1️⃣ Referências das duas compras
  const purchaseRef = doc(purchasesCollection, purchaseId)
  const plannedRef = doc(modelsCollection, plannedPurchaseId)
  const finalRef = doc(modelsCollection, finalPurchaseId)
  const purchaseGeralRef = doc(purchaseGeralCollection, purchaseGeralId)
  const priceFormatted = `R$ ${price.toFixed(2).replace(".", ",")}`
  // 2️⃣ Atualiza ambas para marcar como finalizadas
  await Promise.all([
    updateDoc(plannedRef, { is_execute: true, is_closed: true, updated_at: now }),
    updateDoc(finalRef, { is_execute: true, is_closed: true, updated_at: now, final_price: price, final_amount: amount, final_price_formatted: priceFormatted }),
    updateDoc(purchaseRef, {
      is_execute: true,
      is_closed: true,
      updated_at: now,
      final_price: price,
      final_amount: amount,
      final_price_formatted: priceFormatted,
      status: "final",
      status_formatted: "Executada",
      price_real_final: priceFinalOfPurchase,
      execute_date: now
    }),
    updateDoc(purchaseGeralRef, { is_execute: true, is_closed: true, updated_at: now }),
  ])

  console.log("✅ Compra finalizada com sucesso!")
}

  export const plannedPurchase = async (
    groupId: string,
    purchaseId: string,
    plannedPurchaseId: string,
    amount: number,
    price: number,
    purchaseGeralId: string
  ) => {
    const { firestore } = useFirebase()
    const now = new Date()

    const groupsCollection = collection(firestore, "Groups")
    const purchasesCollection = collection(firestore, "Groups", groupId, "Purchases")
    const purchasesPlannedCollection = collection(firestore, "Groups", groupId, "Purchases", purchaseId, "Models")
    const purchaseGeralCollection = collection(firestore, "Purchases")

    // 1️⃣ Referências das duas compras
    const groupRef = doc(groupsCollection, groupId)
    const purchaseRef = doc(purchasesCollection, purchaseId)
    const plannedRef = doc(purchasesPlannedCollection, plannedPurchaseId)
    const purchaseGeralRef = doc(purchaseGeralCollection, purchaseGeralId)
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
        is_planned: true,
        planned_date: now,
        updated_at: now,
        status: "planned",
        status_formatted: "Planejada"
      }),
      updateDoc(purchaseGeralRef, { 
        is_planned: true,
        updated_at: now
      }),
    ])

    console.log("✅ Compra planejada com sucesso!")
  }

  // Criar um participante dentro de uma empresa
  export const createParticipantInPurchase = async (
    groupId: string,
    purchaseId: string,
    userGroupId: string,
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
        user_group_id: userGroupId,
        status: "membro",
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
        status: "membro",
        is_closed: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      }
    )

    const docRef = doc(
        firestore,
        "Groups",
        groupId // Use o ID do documento aqui
    );

    await updateDoc(docRef, {
        members: arrayUnion(user.id),
        updated_at: now
    });

    return participantGroupRef.id
  }

  export const createFriendRequest = async (
      userFrom: {
        id: string,
        name: string,
        email: string
      },
      userTo: {
        id: string,
        name: string,
        email: string
      }
  ) => {
      const { firestore } = useFirebase();
      const now = new Date()

      // 💡 PASSO 1: CALCULAR O ID DE PAR
      const userPairId = generateUserPairId(userFrom.id, userTo.id);

      // 💡 PASSO 2: CONSULTA CORRIGIDA (SEM MÚLTIPLOS array-contains)
      const q = query(
          collection(firestore, "Friendships"),
          where("is_active", "==", true),
          where('user_pair_id', '==', userPairId), // <-- Usando o novo campo
          limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
          return {
              status: 300,
              message: 'Você já tem uma amizade ativa com este usuário.',
              id: querySnapshot.docs[0]?.id // Opcional: retornar o ID da amizade
          }
      }

      // PASSO 3: CRIAR O PEDIDO DE AMIZADE
      const friendRequestRef = await addDoc(
          collection(firestore, "FriendRequests"),
          {
              is_refused: null,
              user_from_id: userFrom.id,
              user_to_id: userTo.id,
              users: [userFrom.id, userTo.id],
              status: "aberto",
              is_closed: false,
              is_active: true,
              created_at: now,
              updated_at: now,
          }
      )

      return {
          status: 200,
          message: 'Pedido criado com sucesso',
          id: friendRequestRef.id
      }
  }

  export const updateFriendRequest = async (
    isRefused: boolean,
    FriendRequestId: string
  ) => {
    const { firestore } = useFirebase();
    const now = new Date()

    const docRef = doc(
        firestore,
        "FriendRequests",
        FriendRequestId // Use o ID do documento aqui
    );

    await updateDoc(docRef, {
        is_refused: isRefused,
        is_closed: true,
        is_active: false,
        updated_at: now
    });
  }

  export const createFriendship = async (
      userFrom: {
        id: string,
        name: string,
        email: string
      },
      userTo: {
        id: string,
        name: string,
        email: string
      },
      friendRequestId: string
  ) => {
      const { firestore } = useFirebase();
      const now = new Date()

      // Gerar o ID do par para salvar
      const userPairId = generateUserPairId(userFrom.id, userTo.id);

      // 1. Atualizar o pedido para Fechado/Ativo
      await updateFriendRequest(false, friendRequestId)

      // 2. Criar o documento de amizade
      const friendRequestRef = await addDoc(
          collection(firestore, "Friendships"),
          {
              user_from: {
                  id: userFrom.id,
                  name: userFrom.name
              },
              user_to: {
                  id: userTo.id,
                  name: userTo.name
              },
              is_closed: false,
              is_active: true,
              created_at: now,
              updated_at: now,
              friend_request_id: friendRequestId,
              friends: [userFrom.id, userTo.id],
              // 💡 SALVANDO O CAMPO DE ÍNDICE
              user_pair_id: userPairId,
          }
      )

      return friendRequestRef.id
  }

  export async function updatePurchaseMemberInOnline(
      purchaseId: string,
      userId: string,
      groupId: string,
  ): Promise<void> {
    
    // Supondo que useFirebase() e as funções do Firestore (doc, updateDoc, FieldValue)
    // estão disponíveis no escopo do arquivo.
    
    const { firestore } = useFirebase();

    const docRef = doc(
        firestore,
        "Groups",
        groupId,
        "Purchases",
        purchaseId 
    );
    
    // A chave é dinâmica: 'members_activity.seuIdDeUsuario123'
    const updateData = {
        // Usa o Timestamp do servidor para precisão e uniformidade
        [`members_activity.${userId}`]: serverTimestamp(), 
        updated_at: serverTimestamp() // Opcional: atualiza o timestamp do documento
    };

    await updateDoc(docRef, updateData);
  }