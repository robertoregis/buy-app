<script lang="ts">
    export default {
        props: {
            label: {
                type: String,
                required: true
            },
            color: {
                type: String,
                required: false
            },
            isFlat: {
                type: Boolean,
                required: false,
                default: true
            }
        },
        setup(props) {
            const label = toRef(props, 'label')
            const color = toRef(props, 'color')
            const isFlat = toRef(props, 'isFlat')

            const windowWidth = ref<number | null>(null)
            const isOpen = ref<boolean>(false)

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
                label,
                color,
            }
        }
    }
</script>
<template>
    <button v-if="isFlat" :class="`${color}`" class="text-sm font-[500] cursor-pointer px-5 py-1 rounded text-white hover:opacity-90">{{ label }}</button>
    <button v-else class="text-sm font-[500] cursor-pointer p-1 rounded hover:bg-gray-100/80">{{ label }}</button>
</template>