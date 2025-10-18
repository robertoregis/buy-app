<script lang="ts">
    export default {
        props: {
            label: {
                type: String,
                required: false
            },
            color: {
                type: String,
                required: false
            },
            isFlat: {
                type: Boolean,
                required: false,
                default: true
            },
            icon: {
                type: String,
                required: true
            },
            iconClass: {
                type: String,
                required: false
            }
        },
        setup(props) {
            const label = toRef(props, 'label')
            const color = toRef(props, 'color')
            const isFlat = toRef(props, 'isFlat')
            const icon = toRef(props, 'icon')
            const iconClass = toRef(props, 'iconClass')

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
                icon,
                isFlat,
                iconClass
            }
        }
    }
</script>
<template>
    <button v-if="isFlat" :class="`${color}`" class="flex items-center text-sm font-[500] cursor-pointer px-2 py-1 rounded hover:opacity-90">
        <Icon :name="icon" :class="`${label ? 'mr-2 text-lg' : 'text-xl'} ${iconClass}`" />
        {{ label }}
    </button>
    <button v-else class="text-sm font-[500] cursor-pointer p-1 rounded hover:bg-gray-100/80">{{ label }}</button>
</template>