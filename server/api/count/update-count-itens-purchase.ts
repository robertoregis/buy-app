import { defineEventHandler, readBody, createError } from 'h3';
// Importe a instância do 'adminFirestore' do seu arquivo utilitário
import { adminFirestore } from '../../utils/firebase'; 
// Importe o FieldValue do Admin SDK
import { FieldValue } from 'firebase-admin/firestore';

export default defineEventHandler(async (event) => {
    // 1. Garantir que o método é POST
    if (event.req.method !== 'POST') {
        throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' });
    }

    // 2. Ler o corpo da requisição
    const { groupId, purchaseId, action, userId } = await readBody(event);

    // 3. Validar os dados
    if (!groupId || !purchaseId || !['increment', 'decrement'].includes(action)) {
        throw createError({ 
            statusCode: 400, 
            statusMessage: 'Missing or invalid fields (groupId, purchaseId, action)' 
        });
    }

    // 4. Definir o valor do incremento (atômico)
    const incrementValue = action === 'increment' ? 1 : -1;

    try {
        // 5. DEFINIR AS TRÊS REFERÊNCIAS
        
        // Ref 1: O documento da Compra
        const purchaseRef = adminFirestore
            .collection('Grupos')
            .doc(groupId)
            .collection('Compras')
            .doc(purchaseId);

        // Ref 2: O documento do Grupo
        const groupRef = adminFirestore
            .collection('Grupos')
            .doc(groupId);

        // Ref 2: O documento do Grupo
        const userRef = adminFirestore
            .collection('Users')
            .doc(groupId);

        // Ref 3: O documento do Dashboard Geral
        // (Use um caminho fixo para estatísticas globais)
        const dashboardRef = adminFirestore
            .collection('Stats') // Coleção de estatísticas
            .doc('dashboard');  // Documento único para o dashboard

        
        // 6. CRIAR UM BATCH WRITE (ESCRITA ATÔMICA)
        const batch = adminFirestore.batch();

        // Atualiza o total de itens na Compra
        batch.update(purchaseRef, { 
            totalItems: FieldValue.increment(incrementValue) 
        });

        // Atualiza o total de itens no Grupo
        batch.update(groupRef, { 
            totalItems: FieldValue.increment(incrementValue) 
        });

        // Atualiza o total de itens no Usuário
        batch.update(userRef, { 
            totalItems: FieldValue.increment(incrementValue) 
        });

        // Atualiza o total de itens no Dashboard Geral
        batch.update(dashboardRef, { 
            totalItems: FieldValue.increment(incrementValue) 
        });

        // 7. EXECUTAR O BATCH
        await batch.commit();

        // 8. Retornar sucesso
        return { 
            success: true, 
            message: `Agregação em cascata (${action}) executada com sucesso.` 
        };

    } catch (err: any) {
        console.error('Error in cascade aggregation API:', err);
        throw createError({ 
            statusCode: 500, 
            statusMessage: `Failed to update cascade count: ${err.message}` 
        });
    }
});