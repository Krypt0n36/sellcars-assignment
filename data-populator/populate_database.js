const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const fs = require('fs');

const client = new MongoClient('mongodb://mongo:27017', {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

const db = client.db("sellcars");

const users_data = JSON.parse(fs.readFileSync('./default_users.json'));
const customers_data = JSON.parse(fs.readFileSync('./default_customers.json'));

console.log('[~] Populating database.')

db.collection('users').insertMany(users_data).then(()=>{
    db.collection('customers').insertMany(customers_data).then(()=>{
        console.log('[+] Data importing finished.');
        client.close();
    })

})


