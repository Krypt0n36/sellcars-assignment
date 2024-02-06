<script setup>
import { onMounted, ref } from 'vue'
import Message from 'primevue/message';
import Button from "primevue/button";
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Card from 'primevue/card';
import axios from 'axios';
import VueCookies from 'vue-cookies'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const router = useRouter();
const toast = useToast();

const username = ref(null);
const password = ref(null);
const error_message = ref(null);

const authenticate = ()=>{

  axios.post(`/authenticate`, {
    username: username.value,
    password: password.value,
  })
    .then((resp)=>{
      console.log(resp.data)
      if(resp.data.status == 'ERROR'){
        error_message.value = resp.data.message;
      }else if(resp.data.status == 'OK'){
        VueCookies.set('token', resp.data.token);
        VueCookies.set('account_name', resp.data.account_name);
        VueCookies.set('last_login', resp.data.last_login);
        router.push('/');
      }
      else{
        error_message.value = `Unexpected response from server, please check console.`;
        console.log(resp.data);
      }
    })
    .catch((err)=>{
      error_message.value = `Could not establish connection with backend, please check configuration.`
    })
}

onMounted(()=>{
  if(Object.keys(router.currentRoute.value.query).indexOf('sessionExpired')>=0){
    toast.add({ severity: 'warn', summary: 'Session expired', detail: `Your session has expired, please log in again.`, life: 3000 });
  }
})

</script>

<template>
  <Card class="card">
    <template #title>Log in {{  }}</template>
    <template #content>
      <div class="flex flex-column gap-2 mb-2">
        <label for="username">Username </label>
        <InputText id="username" v-model="username" aria-describedby="username-help" />
      </div>
      <div class="flex flex-column gap-2">
        <label for="username">Password</label>
        <Password id="password" class="w-full" v-model="password" toggleMask :feedback="false"/>
      </div>
      <div v-if="error_message!=null">
        <Message severity="error">{{error_message}}</Message>
      </div>
    </template>
    <template #footer>
      
      <div class="flex gap-3 mt-1">
        <Button label="Continue" severity="primary" class="w-full" @click="authenticate" />
      </div>
    </template>
  </Card>
  <Toast />
</template>
<style>
.card {
  width: 400px;
  margin: auto;
  margin-top: 100px;
}
.p-password-input{width:100%;}
</style>
