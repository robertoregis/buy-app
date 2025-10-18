import { defineNuxtPlugin } from "nuxt/app";
import Notifications from "@kyvg/vue3-notification";

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof Notifications.install === "function") {
    Notifications.install(nuxtApp.vueApp);
  }
});