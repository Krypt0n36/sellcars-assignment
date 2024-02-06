// src/router.js
import Dashboard from './Dashboard.vue';
import Login from './Login.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  }
];
export default routes;