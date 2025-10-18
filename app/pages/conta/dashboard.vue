<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue';
import { useParams } from '../../stores/params.js';
const params = useParams();

definePageMeta({
    layout: 'dashboard'
});

const router = useRouter();

// Dados de exemplo para simular amigos e compras
const friends = ref([
    { id: 1, name: 'João', friendshipDate: '2024-05-10', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026704' },
    { id: 2, name: 'Maria', friendshipDate: '2024-06-20', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026705' },
    { id: 3, name: 'Pedro', friendshipDate: '2024-07-01', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026706' }
]);

const purchases = ref([
    {
        id: 1,
        title: 'Compra de Mercado',
        date: '2025-09-28',
        items: [
            { quantity: 5, price: 10.50, suggestedPrice: 10.00 },
            { quantity: 2, price: 5.25, suggestedPrice: 6.00 }
        ],
        friendId: 1 // Compra feita com João
    },
    {
        id: 2,
        title: 'Material de Escritório',
        date: '2025-09-25',
        items: [
            { quantity: 1, price: 50.00, suggestedPrice: 55.00 }
        ],
        friendId: 2 // Compra feita com Maria
    },
    {
        id: 3,
        title: 'Eletrônicos',
        date: '2025-09-20',
        items: [
            { quantity: 1, price: 300.00, suggestedPrice: 300.00 }
        ],
        friendId: null // Sem amigo
    },
    {
        id: 4,
        title: 'Outro Mercado',
        date: '2025-09-26',
        items: [
            { quantity: 3, price: 12.00, suggestedPrice: 11.50 }
        ],
        friendId: 1 // Outra compra com João
    }
]);

// --- Propriedades Computadas para as Métricas ---

// Total de Compras
const totalPurchases = computed(() => purchases.value.length);

// Quantidade total de itens
const totalItems = computed(() => {
    return purchases.value.reduce((sum, purchase) => {
        const itemQuantity = purchase.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        return sum + itemQuantity;
    }, 0);
});

// Preço total final de todas as compras
const totalFinalPrice = computed(() => {
    return purchases.value.reduce((sum, purchase) => {
        const price = purchase.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0);
        return sum + price;
    }, 0);
});

// Número total de amigos
const totalFriends = computed<any>(() => friends.value.length);

// Última compra feita
const lastPurchase = computed<any>(() => {
    // Sort the purchases by date in descending order
    const sorted = [...purchases.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
});

// Último amigo adicionado
const lastFriend = computed<any>(() => {
    // Sort the friends by friendshipDate in descending order
    const sorted = [...friends.value].sort((a, b) => new Date(b.friendshipDate).getTime() - new Date(a.friendshipDate).getTime());
    return sorted[0];
});

// Quantidade de compras por amigo
const purchasesByFriend = computed<any>(() => {
    const friendCounts: any = {};
    purchases.value.forEach(purchase => {
        if (purchase.friendId) {
            friendCounts[purchase.friendId] = (friendCounts[purchase.friendId] || 0) + 1;
        }
    });
    return friendCounts;
});

// --- Lógica de Carregamento e Outros ---
onBeforeMount(() => {
    params.changeRouteCurrent('dashboard');
    // Aqui você faria as chamadas para as APIs do Supabase para buscar os dados de compras e amigos
    // Ex: const { data: purchaseData } = await supabase.from('purchases').select('*');
    // Ex: const { data: friendData } = await supabase.from('friends').select('*');
    // purchases.value = purchaseData;
    // friends.value = friendData;
});
</script>
<template>
    <main class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div class="p-6 bg-blue-100 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold text-blue-800">Total de Compras</h3>
                <p class="mt-2 text-4xl font-bold text-blue-900">{{ totalPurchases }}</p>
            </div>
            
            <div class="p-6 bg-green-100 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold text-green-800">Total de Itens</h3>
                <p class="mt-2 text-4xl font-bold text-green-900">{{ totalItems }}</p>
            </div>

            <div class="p-6 bg-indigo-100 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold text-indigo-800">Total de Amigos</h3>
                <p class="mt-2 text-4xl font-bold text-indigo-900">{{ totalFriends }}</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div class="p-6 bg-white rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-4 text-center">Última Compra</h3>
                <div v-if="lastPurchase" class="flex flex-col">
                    <span class="text-2xl font-bold">{{ lastPurchase.title }}</span>
                    <span class="text-sm text-gray-500">
                        {{ new Date(lastPurchase.date).toLocaleDateString('pt-BR') }}
                    </span>
                    <p class="mt-2 text-md">
                        Total de itens: 
                        <span class="font-semibold">{{ lastPurchase.items.reduce((sum, item) => sum + item.quantity, 0) }}</span>
                    </p>
                    <div class="mt-2">
                        <p class="font-semibold">Amigo:</p>
                        <div v-if="lastPurchase.friendId" class="flex items-center mt-2">
                            <img :src="friends.find(f => f.id === lastPurchase.friendId)?.photo" class="w-10 h-10 rounded-full mr-2" />
                            <span class="text-lg">{{ friends.find(f => f.id === lastPurchase.friendId)?.name }}</span>
                        </div>
                        <span v-else class="text-gray-500">Nenhum amigo nesta compra.</span>
                    </div>
                </div>
                <div v-else class="text-center text-gray-500">
                    <p>Nenhuma compra registrada.</p>
                </div>
            </div>

            <div class="p-6 bg-white rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-4 text-center">Último Amigo Adicionado</h3>
                <div v-if="lastFriend" class="flex flex-col items-center">
                    <img :src="lastFriend.photo" alt="Foto do Amigo" class="w-24 h-24 rounded-full mb-4">
                    <span class="text-2xl font-bold">{{ lastFriend.name }}</span>
                    <span class="text-sm text-gray-500 mt-1">
                        Desde: {{ new Date(lastFriend.friendshipDate).toLocaleDateString('pt-BR') }}
                    </span>
                    <p class="mt-4 text-md">
                        Compras feitas juntos: 
                        <span class="font-semibold">{{ purchasesByFriend[lastFriend.id] || 0 }}</span>
                    </p>
                </div>
                <div v-else class="text-center text-gray-500">
                    <p>Nenhum amigo adicionado ainda.</p>
                </div>
            </div>
        </div>
    </main>
</template>