<script setup lang="ts">
  import { useParams } from '../../../../stores/params.js';
  const params = useParams();
  definePageMeta({
    layout: 'dashboard'
  })
  const isView = ref<boolean>(false)
  const router = useRouter();

  onMounted(() => {
    //router.push(`/`)
  })
  
</script>

<template>
  <main class="container mx-auto px-4 max-w-4xl">
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <h2 class="text-3xl font-bold text-gray-800">Detalhes do Amigo</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">
          Informações e ações disponíveis para este amigo
        </p>
      </div>

      <!-- Friend Profile Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Profile Header -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <div class="flex items-center space-x-6">
            <!-- Avatar -->
            <div class="relative">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/buy-app-8c9ec.firebasestorage.app/o/avatar.png?alt=media&token=ae2cef95-b633-491a-9394-4723e541e8e2" 
                alt="Nome da pessoa"
                class="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div class="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <!-- User Info -->
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-gray-800 mb-1">Nome da Pessoa</h1>
              <p class="text-gray-600 mb-2">email@exemplo.com</p>
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <div class="flex items-center space-x-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Amigos desde 17/09/2025</span>
                </div>
                <div class="flex items-center space-x-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>5 grupos em comum</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Ações Disponíveis</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Invite to Group -->
            <button class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group">
              <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span class="font-medium text-sm text-center">Convidar para Grupo</span>
            </button>

            <!-- Create Purchase -->
            <button class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group">
              <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span class="font-medium text-sm text-center">Criar Compra</span>
            </button>

            <!-- Send Message -->
            <button class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group">
              <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span class="font-medium text-sm text-center">Enviar Mensagem</span>
            </button>

            <!-- Remove Friend -->
            <button class="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-center justify-center space-y-2 group">
              <svg class="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              <span class="font-medium text-sm text-center">Remover Amigo</span>
            </button>
          </div>
        </div>

        <!-- Shared Groups Section -->
        <div class="border-t border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Grupos em Comum</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Group Card -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-sm">GC</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800">Grupo Casa</h4>
                  <p class="text-gray-500 text-sm">5 membros • 3 compras ativas</p>
                </div>
              </div>
            </div>

            <!-- Group Card -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors cursor-pointer">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-sm">TF</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800">Trabalho Faculdade</h4>
                  <p class="text-gray-500 text-sm">8 membros • 1 compra ativa</p>
                </div>
              </div>
            </div>
          </div>

          <!-- No Groups State -->
          <div v-if="false" class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-gray-400 mb-3">
              <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <p class="text-gray-600 font-medium">Nenhum grupo em comum</p>
            <p class="text-gray-500 text-sm mt-1">Convide este amigo para um grupo</p>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="border-t border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Atividade Recente</h3>
          <div class="space-y-3">
            <!-- Activity Item -->
            <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-800">
                  Criou uma nova compra em <strong>Grupo Casa</strong>
                </p>
                <p class="text-xs text-gray-500">Hoje às 14:30</p>
              </div>
            </div>

            <!-- Activity Item -->
            <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-800">
                  Finalizou uma compra em <strong>Trabalho Faculdade</strong>
                </p>
                <p class="text-xs text-gray-500">Ontem às 10:15</p>
              </div>
            </div>
          </div>

          <!-- No Activity State -->
          <div v-if="false" class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-gray-400 mb-3">
              <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-gray-600 font-medium">Nenhuma atividade recente</p>
            <p class="text-gray-500 text-sm mt-1">A atividade aparecerá aqui</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
</style>