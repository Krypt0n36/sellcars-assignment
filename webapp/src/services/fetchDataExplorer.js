import { ref } from 'vue';

const customers = ref([]);
const loading = ref(true);

const getCustomers = () => {
  // Simulated API call
  console.log('called customers')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([{
        id: 1000,
        name: 'James Butt',
        country: {
            name: 'Algeria',
            code: 'dz'
        },
        company: 'Benton, John B Jr',
        date: '2015-09-13',
        status: 'unqualified',
        verified: true,
        activity: 17,
        representative: {
            name: 'Ioni Bowcher',
            image: 'ionibowcher.png'
        },
        balance: 70663
    },]);
    }, 1000);
  });
};

const CustomerService = {
  async getCustomersMedium() {
    try {
      loading.value = true;
      const data = await getCustomers();
      customers.value = data;
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      loading.value = false;
    }
  },
};

export { customers, loading, CustomerService };
