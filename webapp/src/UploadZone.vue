<script setup>
import FileUpload from 'primevue/fileupload';
import Button from "primevue/button";
import ProgressBar from 'primevue/progressbar';
import Badge from 'primevue/badge';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import {defineProps} from 'vue';
import VueCookies from 'vue-cookies'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter();
const toast = useToast();

const props = defineProps({
  name: String,
  endpoint: String,
})
const onSessionExpired = () => {
    VueCookies.remove('token');
    VueCookies.remove('account_name');
    VueCookies.remove('last_login');
    router.push({ path: '/login', query: { sessionExpired: '' } });
}

const postUpload = async (event)=>{
  if(event['xhr'].status == 200){
    const respJson = JSON.parse(event['xhr'].response);
    if(respJson.status == 'OK'){
      if(respJson.appended_rows == 0){
        toast.add({ severity: 'warn', summary: 'Finished', detail: `All provided customers are already registered.`, life: 3000 });
      }else{
        toast.add({ severity: 'success', summary: 'Success', detail: `${respJson.appended_rows} new customers are stored.`, life: 3000 });
      }
    }else if(respJson.status=='ERROR'){
      toast.add({ severity: 'warn', summary: 'Fail', detail: `File contains error on line ${respJson.line}, operation aborted.`, life: 3000 });
    }
    return;
  }else if(event['xhr'].status == 403){
    onSessionExpired();
  }
  else{
    toast.add({ severity: 'error', summary: 'Error', detail: `Server responded with an unexpected response code.`, life: 3000 });
  }
}


</script>
<template>
    <div class="upload-zone mt-3 mb-3">
        <h2>Upload {{ name }}</h2>
        <FileUpload mode="basic" :withCredentials="true" name="file" :url="`${endpoint}`" accept="text/csv" :maxFileSize="1000000" @upload="postUpload" />
    </div>
</template>
<style>
.upload-zone{
    width: 100%;
    padding-top:30px;
    padding-bottom: 50px;
    border: 2px dashed rgb(180, 180, 180);
    border-radius: 15px;
    text-align: center;
}
</style>