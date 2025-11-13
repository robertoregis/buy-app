<script lang="ts">
    export default {
        props: {},
        setup(props) {

            const windowWidth = ref<number | null>(null)

            const getWidthOfWindow = () => {
                windowWidth.value = window.innerWidth
            }

            /*onMounted(async () => {
                nextTick(() => {
                    getWidthOfWindow()
                })
                window.addEventListener('resize', getWidthOfWindow)
            })*/


            return {
            }
        }
    }
</script>
<template>
    <div class="fixed bg-red-900 w-[40px] h-[40px] rounded-full flex justify-center items-center">
        <button><Icon name="mdi:bell-ring" class="text-2xl inline-block align-middle" /></button>
    </div>
</template>