<script setup>
import { onMounted, ref } from 'vue'
import Button from "primevue/button";
import Fieldset from 'primevue/fieldset';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import UploadZone from './UploadZone.vue';
import DataExplorer from './DataExplorer.vue';
import InputGroup from 'primevue/inputgroup';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import Tooltip from 'primevue/tooltip';
import VueCookies from 'vue-cookies'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter();

const value = ref(null);
const variable = ref(null);

const customers = ref([]);
const toast = useToast();

const loading = ref(true);

const allowed_queries = [{ name: 'Internal Number', code: 'intnr' },
{ name: 'Customer type', code: 'type' },
{ name: 'Contact first name', code: 'contact_persons.first_name' },
{ name: 'Contact last name', code: 'contact_persons.second_name' },
{ name: 'Contact Email', code: 'contact_persons.email' },
{ name: 'Company Name', code: 'addresses.company_name' },
{ name: 'Country', code: 'addresses.country' },
{ name: 'ZIP', code: 'addresses.zip' },
{ name: 'City', code: 'addresses.city' },
{ name: 'Street', code: 'addresses.street' }];
const query = ref({});


const addFilter = () => {
    if ((variable.value != null) && (value.value != null)) {
        query.value = Object.assign(query.value, { [variable.value.code]: value.value });
        variable.value = null;
        value.value = null;
    }
}
const removeFilter = (key) => {
    const shallow_clone = { ...query.value };
    delete shallow_clone[key];
    query.value = shallow_clone;
}
const resetFilters = () => {
    query.value = {};
    pullData();
}
const onSessionExpired = () => {
    VueCookies.remove('token');
    VueCookies.remove('account_name');
    VueCookies.remove('last_login');
    router.push({ path: '/login', query: { sessionExpired: '' } });
}
function pullData() {
    axios.get(`/pull?${Object.keys(query.value).map(q => q + '=' + query.value[q]).join('&')}`,
        {
            headers: {
                'Authorization': `Bearer ${VueCookies.get('token')}`
            }
        })
        .then((resp) => {
            if (resp.status == 403) {
                onSessionExpired();
            }
            if (resp.data.status != 'OK') {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Server responded with unexpected message.', life: 3000 });
            } else {
                customers.value = [...resp.data.data];
            }
            loading.value = false;
        })
        .catch((err) => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Server is not reachable.', life: 3000 });
        })
}

// session info
const account_name = ref('');
const last_login = ref('');

onMounted(() => {
    if (!VueCookies.get('token')) {
        onSessionExpired();
    } else {
        account_name.value = VueCookies.get('account_name');
        last_login.value = VueCookies.get('last_login');
        pullData();
    }

})

const logout = () => {
    onSessionExpired(); // Logout 
}

</script>

<template>
    <div class="flex flex-row">
        <div class="w-3 p-2">
            <Card>
                <template #content>
                    <div class="flex flex-row">
                        <Avatar :label="account_name.substring(0, 2)" class="mr-2" size="xlarge" />

                        <div>
                            <h2 id="account_name">{{ account_name }}</h2>
                            <h5 id="last_login">Last login : {{ last_login }}</h5>
                        </div>
                        <Button icon="pi pi-sign-out" severity="danger" text aria-label="Signout" @click="logout"></Button>

                    </div>
                    <UploadZone name="customers" endpoint="/upload_customers" />
                    <UploadZone name="contact persons" endpoint="/upload_contact_persons" />
                    <UploadZone name="addresses" endpoint="/upload_addresses" />

                </template>
            </Card>
        </div>
        <div class="w-9 p-2">
            <Card>
                <template #title>Data Explorer</template>

                <template #content>

                    <Fieldset legend="Search">

                        <div v-for="(k, index) in Object.keys(query)" :key="index">
                            <InputGroup class="mb-2">
                                <Dropdown optionLabel="name" :placeholder="`${k}`" :options="allowed_queries" class="w-20"
                                    readonly />
                                <InputText placeholder="Value" :model-value="query[k]" readonly />
                                <Button icon="pi pi-trash" severity="secondary" text aria-label="Remove"
                                    @click="removeFilter(k)" />
                            </InputGroup>
                        </div>
                        <InputGroup class="mb-2">
                            <Dropdown optionLabel="name" v-model="variable" placeholder="Select a key"
                                :options="allowed_queries" class="w-20" />
                            <InputText placeholder="Value" v-model="value" />

                            <Button icon="pi pi-plus" severity="success" text aria-label="Add filter" @click="addFilter" />
                        </InputGroup>

                        <div class="flex flex-row w-full text-right mt-4">
                            <Button label="Reset" severity="secondary" text class="m-right" @click="resetFilters" />
                            <Button label="Search" severity="primary" class="m-auto mr-0" @click="pullData"
                                :disabled="Object.keys(query).length == 0"
                                v-tooltip="Object.keys(query).length == 0 && 'Please add at least one query'" />
                        </div>
                    </Fieldset>
                    <br>
                    <DataExplorer :data="customers" :loading="loading" :refreshhook="pullData" />

                </template>
            </Card>
        </div>
    </div>
</template>
<style>
.p-fieldset-content {
    padding: 0px;
}

.ds-card {
    background-color: black;
}

.text-right {
    text-align: right;
}

.card {
    width: 400px;
    margin: auto;
    margin-top: 100px;
}

.p-fieldset-legend {
    border: none;
}

.p-password-input {
    width: 100%;
}

#account_name {
    margin: 0px;
    margin-top: 10px;
}

#last_login {
    margin: 0px;
    margin-top: auto;
}
</style>
