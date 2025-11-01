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

// Economia total (suggestedPrice vs price)
const totalSavings = computed(() => {
    return purchases.value.reduce((sum, purchase) => {
        const purchaseSavings = purchase.items.reduce((itemSum, item) => {
            const suggestedTotal = item.quantity * item.suggestedPrice;
            const actualTotal = item.quantity * item.price;
            return itemSum + (suggestedTotal - actualTotal);
        }, 0);
        return sum + purchaseSavings;
    }, 0);
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
    <main class="container mx-auto px-4 max-w-7xl">
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center space-y-3">
                <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p class="text-gray-600 max-w-2xl mx-auto">
                    Visão geral das suas compras, amigos e economias
                </p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total de Compras -->
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-blue-100 text-sm font-medium">Total de Compras</p>
                            <p class="text-3xl font-bold mt-2">{{ totalPurchases }}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-blue-100 text-xs mt-3">Compras realizadas</p>
                </div>

                <!-- Total de Itens -->
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-green-100 text-sm font-medium">Total de Itens</p>
                            <p class="text-3xl font-bold mt-2">{{ totalItems }}</p>
                        </div>
                        <div class="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-green-100 text-xs mt-3">Itens comprados</p>
                </div>

                <!-- Total de Amigos -->
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-purple-100 text-sm font-medium">Total de Amigos</p>
                            <p class="text-3xl font-bold mt-2">{{ totalFriends }}</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-purple-100 text-xs mt-3">Amigos conectados</p>
                </div>

                <!-- Economia Total -->
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-orange-100 text-sm font-medium">Economia Total</p>
                            <p class="text-3xl font-bold mt-2">R$ {{ totalSavings.toFixed(2) }}</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-orange-100 text-xs mt-3">Economizados até agora</p>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Última Compra -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Última Compra</h3>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Recente
                        </span>
                    </div>
                    
                    <div v-if="lastPurchase" class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800">{{ lastPurchase.title }}</h4>
                                <p class="text-gray-500 text-sm">
                                    {{ new Date(lastPurchase.date).toLocaleDateString('pt-BR') }}
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-bold text-green-600">
                                    R$ {{ lastPurchase.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2) }}
                                </p>
                                <p class="text-sm text-gray-500">{{ lastPurchase.items.reduce((sum, item) => sum + item.quantity, 0) }} itens</p>
                            </div>
                        </div>

                        <div class="border-t border-gray-200 pt-4">
                            <p class="font-semibold text-gray-700 mb-2">Comprado com:</p>
                            <div v-if="lastPurchase.friendId" class="flex items-center space-x-3">
                                <img 
                                    :src="friends.find(f => f.id === lastPurchase.friendId)?.photo" 
                                    class="w-10 h-10 rounded-full border-2 border-gray-200"
                                />
                                <div>
                                    <p class="font-medium text-gray-800">{{ friends.find(f => f.id === lastPurchase.friendId)?.name }}</p>
                                    <p class="text-sm text-gray-500">
                                        {{ purchasesByFriend[lastPurchase.friendId] || 0 }} compras juntos
                                    </p>
                                </div>
                            </div>
                            <div v-else class="text-center py-4 bg-gray-50 rounded-lg">
                                <p class="text-gray-500">Compra individual</p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="text-center py-8">
                        <div class="text-gray-400 mb-3">
                            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                            </svg>
                        </div>
                        <p class="text-gray-600 font-medium">Nenhuma compra registrada</p>
                        <p class="text-gray-500 text-sm mt-1">Suas compras aparecerão aqui</p>
                    </div>
                </div>

                <!-- Último Amigo -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Último Amigo</h3>
                        <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Novo
                        </span>
                    </div>
                    
                    <div v-if="lastFriend" class="space-y-4">
                        <div class="flex items-center space-x-4">
                            <img 
                                :src="lastFriend.photo" 
                                alt="Foto do Amigo" 
                                class="w-16 h-16 rounded-full border-2 border-purple-200"
                            />
                            <div class="flex-1">
                                <h4 class="text-lg font-semibold text-gray-800">{{ lastFriend.name }}</h4>
                                <p class="text-gray-500 text-sm">
                                    Amigos desde {{ new Date(lastFriend.friendshipDate).toLocaleDateString('pt-BR') }}
                                </p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            <div class="text-center p-3 bg-blue-50 rounded-lg">
                                <p class="text-2xl font-bold text-blue-600">{{ purchasesByFriend[lastFriend.id] || 0 }}</p>
                                <p class="text-sm text-blue-800">Compras juntos</p>
                            </div>
                            <div class="text-center p-3 bg-green-50 rounded-lg">
                                <p class="text-2xl font-bold text-green-600">{{ totalFriends }}</p>
                                <p class="text-sm text-green-800">Amigos no total</p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="text-center py-8">
                        <div class="text-gray-400 mb-3">
                            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                            </svg>
                        </div>
                        <p class="text-gray-600 font-medium">Nenhum amigo adicionado</p>
                        <p class="text-gray-500 text-sm mt-1">Seus amigos aparecerão aqui</p>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-6">Ações Rápidas</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <NuxtLink 
                        to="/conta/compras" 
                        class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group"
                    >
                        <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span class="font-medium text-sm text-center">Nova Compra</span>
                    </NuxtLink>

                    <NuxtLink 
                        to="/conta/amigos" 
                        class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group"
                    >
                        <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                        </svg>
                        <span class="font-medium text-sm text-center">Adicionar Amigo</span>
                    </NuxtLink>

                    <NuxtLink 
                        to="/conta/grupos" 
                        class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group"
                    >
                        <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        <span class="font-medium text-sm text-center">Ver Grupos</span>
                    </NuxtLink>

                    <NuxtLink 
                        to="/conta/amigos/pedidos" 
                        class="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group"
                    >
                        <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                        <span class="font-medium text-sm text-center">Pedidos</span>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </main>
</template>