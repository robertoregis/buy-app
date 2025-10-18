<script setup lang="ts">
    import { useParams } from '../../../stores/params.js';
    import { collection, getDocs, query, where,
        getCountFromServer, getDoc, doc, updateDoc, Timestamp, orderBy,
        limit,startAt, limitToLast, endAt
    } from 'firebase/firestore';
    import { useFirebase } from '../../../composables/useFirebase';
    import { useAuthentication } from '../../../stores/authentication';
    import { convertDateFirestore } from '../../../composables/convert.js';

    const params = useParams();
    definePageMeta({
        layout: 'dashboard'
    })
    const { firestore } = useFirebase()
    const router = useRouter()
    const isCreateGroupModal = ref<boolean>(false)
    const isGroupModal = ref<boolean>(false)
    const totalResult = ref<any>(0)
    const groups = ref<any[]>([])
    const loading = ref<boolean>(true)
    const currentPage = ref<number>(1)
    const authentication = useAuthentication();
    const nextPage = ref<boolean>(false)
    const lastVisible = ref<any>()
    const docs = ref<any>([])
    const initVisible = ref<any>()
    
    const getGroups = async () => {
        try {
            let constraints = [
                orderBy("created_at", "desc"),
                limit(13),
                where("members", 'array-contains', authentication.userId),
                where('is_active', "==", true),
                //where("is_closed", "==", false)
            ];
            let r = query(collection(firestore, "Groups"), ...constraints);
            const snapshot = await getCountFromServer(r);
            totalResult.value = snapshot.data().count
            constraints.push(limit(13))
            let q = query(collection(firestore, "Groups"), ...constraints);
            const querySnapshot = await getDocs(q);
            groups.value = []
            querySnapshot.forEach((doc) => {
                groups.value.push({
                    id: doc.id,
                    ...doc.data()
                })
            });
            console.log(groups.value)
            if(groups.value.length > 12) {
                nextPage.value = true
                lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
                groups.value.pop()
            } else {
                nextPage.value = false
            }
            loading.value = false
        } catch(error) {
            console.log(error)
        }
    }
    const getMoreGroups = async (isPreview: boolean) => {
        let q: any
        if(isPreview) {
            let end = nextPage.value ? initVisible.value : lastVisible.value
            let constraints = [
                orderBy("created_at", "desc"),
                endAt(end),
                limitToLast(13),
                where("members", 'array-contains', authentication.userId),
                where('is_active', "==", true),
            ];
            q = query(collection(firestore, "Groups"), ...constraints);
        } else {
            let constraints = [
                orderBy("created_at", "desc"),
                startAt(lastVisible.value),
                limit(13),
                where("members", 'array-contains', authentication.userId),
                where('is_active', "==", true),
            ];
            q = query(collection(firestore, "Groups"), ...constraints);
        } 
        const querySnapshot = await getDocs(q);
        groups.value = []
        querySnapshot.forEach((doc: any) => {
            groups.value.push({
                id: doc.id,
                ...doc.data()
            })
        });
        if(groups.value.length > 12) {
            nextPage.value = true
            docs.value = querySnapshot.docs
            lastVisible.value = querySnapshot.docs[querySnapshot.docs.length-1];
            initVisible.value = querySnapshot.docs[querySnapshot.docs.length-13];
            groups.value.pop()
        } else {
            nextPage.value = false
        }
        loading.value = false
    }
    const changeGetGroups = async (isChange: boolean, mode: number) => {
        let isPreview = false
        if(isChange) {
            await getGroups()
        } else {
            if(mode === 1) {
                currentPage.value--
                isPreview = true
            } else {
                currentPage.value++
            }
            await getMoreGroups(isPreview)
        }
    }

    const goGroup = (group: any) => {
        authentication.setGroup(group)
        localStorage.setItem('buy_group_id', group.id)
        router.push(`/conta/grupos/${group.id}`)
    }

    onMounted(() => {
        getGroups()
    })

    onBeforeMount(() => {
        params.changeRouteCurrent('groups')
    })
</script>

<template>
    <main class="container mx-auto">
        <div class="grid grid-cols">

            <div class="col-span-1 mt-4">
                <h2 class="text-center text-2xl font-[600]">Grupos</h2>
            </div>
            <div v-if="!loading" class="col-span-1 mt-6">
                <div class="grid grid-cols-1">
                    <div class="col-span-1 mt-4">
                        <div class="flex justify-center items-center">
                            <Button @click="isCreateGroupModal = true" label="Criar grupo" color="bg-green-700 text-white" />
                        </div>
                    </div>
                    <div class="col-span-1 mt-4">
                        <div class="grid grid-cols-1">
                            <div class="col-span-1">
                                <div class="grid grid-cols-1 gap-4">
                                    <template v-for="group in groups" :key="group.id">
                                        <div @click="goGroup(group)" role="dialog" tabindex="0" class="cursor-pointer col-span-1 p-2 shadow bg-gray-200 rounded">
                                            <div class="flex flex-col">
                                                <div class="flex items-center justify-between">
                                                    <span class="text-sm mb-1 font-[600]">{{ group.name }}</span>
                                                    <span class="text-[0.8rem] mb-1 font-[600]">{{ convertDateFirestore(group.created_at) }}</span>
                                                </div>
                                                <p class="text-sm mb-1">{{ group.description }}</p>
                                                <!--<div class="flex">
                                                    <span class="bg-red-600 text-white text-[0.8rem]" style="padding: 1px 10px;">Importância</span>
                                                </div>-->
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                            <div class="col-span-1">
                                <div class="flex">
                                    <ul v-if="nextPage || currentPage > 1" class="flex pl-0 rounded-sm overflow-hidden text-neutral-700">
                                        <li :class="currentPage > 1 ? `bg-white` : `bg-neutral-200`" class="border-1 border-neutral-200 flex justify-center items-center">
                                            <button v-if="currentPage > 1" @click="changeGetGroups(false, 1)" class="py-2 px-2">
                                                <Icon name="mdi:arrow-left" class="text-xl" />
                                            </button>
                                            <div v-else class="py-2 px-2">
                                                <Icon name="mdi:arrow-left" class="text-xl" />
                                            </div>
                                        </li>
                                        <li class="border-1 border-teal-900 bg-teal-900 flex justify-center items-center">
                                            <button class="py-2 px-3">
                                                {{currentPage}}
                                            </button>
                                        </li>
                                        <li :class="nextPage ? `bg-white` : `bg-neutral-200`" class="border-1 border-neutral-200 flex justify-center items-center">
                                            <button v-if="nextPage" @click="changeGetGroups(false, 2)" class="py-2 px-2">
                                                <Icon name="mdi:arrow-right" class="text-xl" />
                                            </button>
                                            <div v-else class="py-2 px-2">
                                                <Icon name="mdi:arrow-right" class="text-xl" />
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <CreateGroupModal v-model="isCreateGroupModal" @create="getGroups()" />
</template>
