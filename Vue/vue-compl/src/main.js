import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { firestorePlugin } from "vuefire";
import firebase from "firebase";

import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);
Vue.use(firestorePlugin);
Vue.config.productionTip = false;

firebase.initializeApp({
  apiKey: "AIzaSyCr9weIgmC8rK9Qk86LAquMK8YEZ0-NHe8",
  authDomain: "vue-project-c0b4f.firebaseapp.com",
  databaseURL: "https://vue-project-c0b4f.firebaseio.com",
  projectId: "vue-project-c0b4f",
  storageBucket: "vue-project-c0b4f.appspot.com",
  messagingSenderId: "795902504598",
  appId: "1:795902504598:web:fe859fc76558f4b3cedcb7"
});
export const db = firebase.firestore();

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
