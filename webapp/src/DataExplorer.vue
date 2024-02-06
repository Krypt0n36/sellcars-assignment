
<template>
    <DataTable :value="data" paginator paginator-position="bottom" :rows="5" dataKey="intnr" stripedRows :loading="loading">

        <template #empty> No customers found. </template>
        <template #loading> Loading customers data. Please wait. </template>
        <Column field="intnr" header="#Intnr" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.intnr }}
            </template>
        </Column>
        <Column header="Country" filterField="country" style="min-width: 12rem">
            <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                    <span>{{ data.country }}</span>
                </div>
            </template>

        </Column>
        <Column header="Customer" filterField="full_name" :showFilterMatchModes="false"
            :filterMenuStyle="{ width: '14rem' }" style="min-width: 14rem">
            <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                    <span>{{ data.first_name }} {{ data.second_name }}</span>
                </div>
            </template>
        </Column>
        <Column field="company" header="Company Name" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.company }}
            </template>
        </Column>
        <Column field="zip_city" header="ZIP/City" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.zip }} {{ data.city }}
            </template>

        </Column>
        <Column field="address" header="Address" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.address }}
            </template>
        </Column>
        <Column header="#">
            <template #body="{ data }">
                <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit"
                    @click="selectedRecordEdit = { ...data }" />
                <Button icon="pi pi-trash" severity="warning" text rounded aria-label="Remove"
                    @click="selectedRecordRemoval = data.intnr" />
            </template>
        </Column>


    </DataTable>
    <Dialog :visible="selectedRecordRemoval" modal header="Confirmation" :style="{ width: '25rem' }">
        <span>Are you sure you want to delete this record permanantly ?</span>
        <div class="flex justify-content-end gap-2 mt-5">
            <Button type="button" label="Cancel" text severity="secondary" @click="selectedRecordRemoval = null"></Button>
            <Button type="button" label="Delete" severity="danger" @click="handleDelete(selectedRecordRemoval)"></Button>
        </div>
    </Dialog>
    <Dialog :visible="selectedRecordEdit" modal header="Edit record" :style="{ width: '50rem' }">
        <div class="flex flex-row">
            <div class="flex flex-column gap-2 mb-3 w-6 p-1">
                <label for="username">First name :</label>
                <InputText id="first_name" v-model="selectedRecordEdit.first_name" />
            </div>
            <div class="flex flex-column gap-2 w-6 p-1">
                <label for="username">Second name :</label>
                <InputText id="second_name" v-model="selectedRecordEdit.second_name" />
            </div>
        </div>
        <div class="flex flex-column gap-2 mb-3 p-1">
            <label for="username">Company name :</label>
            <InputText id="company_name" v-model="selectedRecordEdit.company" />
        </div>
        <div class="flex flex-row">
            <div class="flex flex-column gap-2 mb-3 w-6 p-1">
                <label for="username">Country :</label>
                <InputText id="country" v-model="selectedRecordEdit.country" />
            </div>
            <div class="flex flex-column gap-2 w-6 p-1">
                <label for="username">City :</label>
                <InputText id="city" v-model="selectedRecordEdit.city" />
            </div>
        </div>
        <div class="flex flex-row">
            <div class="flex flex-column gap-2 mb-3 w-3 p-1">
                <label for="username">Zip :</label>
                <InputText id="country" v-model="selectedRecordEdit.zip" />
            </div>
            <div class="flex flex-column gap-2 w-9 p-1">
                <label for="username">Address :</label>
                <InputText id="city" v-model="selectedRecordEdit.address" />
            </div>
        </div>


        <div class="flex justify-content-end gap-2 mt-5">
            <Button type="button" label="Cancel" text severity="secondary" @click="selectedRecordEdit = null"></Button>
            <Button type="button" label="Save changes" severity="primary" @click="handleEdit"></Button>
        </div>
    </Dialog>
    <Toast />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { CustomerService } from './services/fetchDataExplorer';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import InputText from 'primevue/inputtext';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import ProgressBar from 'primevue/progressbar';
import Slider from 'primevue/slider';
import OverlayPanel from 'primevue/overlaypanel';
import DataTable from 'primevue/datatable';
import SpeedDial from 'primevue/speeddial';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { defineProps } from 'vue';
import VueCookies from 'vue-cookies'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter();

const props = defineProps({
    data: Array,
    loading: Boolean,
    refreshhook: Function,
})

const toast = useToast();

const onSessionExpired = () => {
    VueCookies.remove('token');
    VueCookies.remove('account_name');
    VueCookies.remove('last_login');
    router.push({ path: '/login', query: { sessionExpired: '' } });
}

const handleDelete = (intnr) => {
    axios.post(`/remove`, { intnr: intnr },{
            headers: {
                'Authorization': `Bearer ${VueCookies.get('token')}`
            }
        })
        .then((resp) => {
            if (resp.status == 403) onSessionExpired();
            if (resp.data.status == 'OK') {
                toast.add({ severity: 'info', summary: 'Done', detail: `Record successfully deleted.`, life: 3000 });
                props.refreshhook();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: `Record cannot be deleted, unexpected response.`, life: 3000 });
            }
            selectedRecordRemoval.value = null;
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: `Record cannot be deleted, server is not reachable.`, life: 3000 });
            selectedRecordRemoval.value = null;
        })
}



const handleEdit = () => {
    axios.post(`/update`, selectedRecordEdit.value, {
            headers: {
                'Authorization': `Bearer ${VueCookies.get('token')}`
            }
        })
        .then((resp) => {
            // Catch authentication failure
            if (resp.status == 403) onSessionExpired();
            if (resp.data.status == 'OK') {
                toast.add({ severity: 'info', summary: 'Done', detail: `Record successfully updated.`, life: 3000 });
                props.refreshhook();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: `Record cannot be updated, unexpected response.`, life: 3000 });
            }
            selectedRecordEdit.value = null;
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: `Record cannot be deleted, server is not reachable.`, life: 3000 });
            selectedRecordEdit.value = null;
        })
}

const selectedRecordRemoval = ref(null);
const selectedRecordEdit = ref(null);

</script>
<style>
th {
    background-color: #111827;
}

.p-paginator-bottom {
    margin-top: 10px;
}

.relative {
    position: 'relative'
}

.actionButton {
    position: 'absolute';
    width: 2rem;
    height: 2rem;
}
</style>
