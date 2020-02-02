import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { firestorePlugin } from "vuefire";
import VueMaterial from "vue-material";
import "vue-material/dist/vue-material.min.css";
import 'vue-material/dist/theme/default.css'
import firebase from "firebase";

Vue.use(firestorePlugin);
Vue.use(VueMaterial);
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
