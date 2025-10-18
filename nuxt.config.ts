// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxt/content', '@nuxt/image', '@nuxt/ui', 'nuxt3-notifications', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  //pages: true,
  //components: true,
  //srcDir: 'src/',
  app: {
    head: {
      title: 'Gerenciador',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '',
        },
      ],
      link: [
        {
          key: 'favicon',
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png',
        },
        {
          key: 'mobileicon',
          rel: 'apple-touch-icon',
          sizes: '512x512',
          href: '/mobileicon.png',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
        },
      ],
      script: [],
    },
  },
  runtimeConfig: {
    FIREBASE_CLIENT_EMAIL: process.env.NUXT_FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.NUXT_FIREBASE_PRIVATE_KEY,
    
    public: {
      API_KEY_FIREBASE: process.env.NUXT_API_KEY_FIREBASE,
      AUTH_DOMAIN_FIREBASE: process.env.NUXT_AUTH_DOMAIN_FIREBASE,
      PROJECT_ID_FIREBASE: process.env.NUXT_PROJECT_ID_FIREBASE,
      STORAGE_BUCKET_FIREBASE: process.env.NUXT_STORAGE_BUCKET_FIREBASE,
      MESSAGING_SENDER_ID_FIREBASE: process.env.NUXT_MESSAGING_SENDER_ID_FIREBASE,
      APP_ID_FIREBASE: process.env.NUXT_APP_ID_FIREBASE,
      MEASUREMENT_ID_FIREBASE: process.env.NUXT_MEASUREMENT_ID_FIREBASE,
    }
  },
})