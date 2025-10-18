import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './nuxt.config.ts',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
