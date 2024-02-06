import { createApp } from 'vue'
import App from './App.vue'
import Login from './Login.vue'
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import routes from './router';
import { createRouter, createWebHistory } from 'vue-router';


const app = createApp(App);
app.use(PrimeVue);
app.directive('tooltip', Tooltip);
app.use(ToastService);
const router = createRouter({
    history: createWebHistory(),
    routes: routes,
})
app.use(router);
app.component('Button', Button)
app.mount('#app')
