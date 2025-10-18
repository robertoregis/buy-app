import VueTippy from 'vue-tippy';
import 'tippy.js/dist/tippy.css'


export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueTippy, {
        directive: 'tippy', // => v-tippy
        component: 'tippy', // => <tippy/>
        componentSingleton: 'tippy-singleton', // => <tippy-singleton/>,
        defaultProps: {
        placement: 'top',
        allowHTML: true,
        }, // => Global default options * see all props
    })
})