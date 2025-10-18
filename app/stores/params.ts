
export const useParams = defineStore('params', () => {
    const routeCurrent = ref<string>('');

    const changeRouteCurrent = (value: string) => {
        routeCurrent.value = value;
    }

    return {
        routeCurrent,
        changeRouteCurrent
    }
})