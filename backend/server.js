
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require('body-parser');
const crypto = require('crypto');
const validator = require('validator');
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');
const { Transform } = require('stream');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const expressJwt = require('express-jwt');
const path = require('path');
const dotenv = require('dotenv').config();


const app = express()
const publicDirectoryPath = path.join(__dirname, 'public');
app.use(express.static(publicDirectoryPath));
app.use(cookieParser());
app.use(bodyParser.json());
const upload = multer({ dest: 'tmp/' })
const port = 3000
const ALLOWED_FSIZE = 500 * 1024;

const uri = "mongodb://mongo:27017";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);
const db = client.db("sellcars");

const secretKey = process.env.secret || 'PLEASECHANGEME';

const authenticateJWT = expressJwt.expressjwt({
    secret: secretKey,
    algorithms: ['HS256']
});


app.get('/login', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.post('/upload_customers', upload.single('file'), (req, res) => {
    const {token} = req.cookies;
    try{
        const result = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    }
    catch{
        res.status(403).send("Invalid token");
        return;
    }
    if (!req.file) {
        res.status(400).send('No file selected');
        return;
    }
    // Check against integrity criteria
    if ((req.file.length > ALLOWED_FSIZE) || (req.file.mimetype !== 'text/csv')) {
        fs.unlinkSync(req.file.path);
        res.status(400).send('Only csv files with size bellow 5KB are allowed.')
        return;
    }
    const results = [];
    const reader = fs.createReadStream(req.file.path)
        .pipe(csvParser({ headers: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'] }))
        .on('data', (data) => results.push(data))
        .on('finish', async () => {
            const filteredResults = [];
            for (let i = 0; i < results.length; i++) {
                if (Object.values(results[i]).every(value => value != '') && (Object.keys(results[i]).length == 14)) {
                    // Trim each attribute
                    const trimmedLine = Object.keys(results[i]).map(key=>({key: results[i][key].trim() }))
                    filteredResults.push(trimmedLine);
                } else {
                    console.log(results[i])
                    console.log(Object.keys(results[i]).length);
                    // Error in one of the lines, Exit from here
                    res.send({ status: 'ERROR', line: i + 1 });
                    fs.unlinkSync(req.file.path);
                    res.end();
                    return;
                }
            }
            let counter = 0;
            for (let i = 0; i < filteredResults.length; i++) {
                const e = await db.collection('customers').findOne({ intnr: filteredResults[i]['A'] });
                if (e == null) {
                    counter++;
                    await db.collection('customers').insertOne(
                        {
                            intnr: filteredResults[i]['A'],
                            type: filteredResults[i]['B'],
                            contact_persons: [{
                                first_name: filteredResults[i]['C'],
                                last_name: filteredResults[i]['D'],
                                email: filteredResults[i]['E'],
                                mobile_phone: filteredResults[i]['F'],
                                birth_date: filteredResults[i]['G'],
                                address: "toddo"
                            }],
                            addresses: [{
                                company_name: filteredResults[i]['H'],
                                country: filteredResults[i]['I'],
                                zip: filteredResults[i]['J'],
                                fax: filteredResults[i]['K'],
                                phone: filteredResults[i]['L'],
                                street: filteredResults[i]['M'],
                                email: filteredResults[i]['N']
                            }]
                        }
                    );
                }
            }

            res.send({ status: `OK`, appended_rows: counter }).end()
            fs.unlinkSync(req.file.path);
        })
        .on('error', () => {
            fs.unlinkSync(req.file.path);
            res.send('error').end()
        })
})


app.post('/upload_contact_persons', upload.single('file'), async (req, res) => {
    const {token} = req.cookies;
    try{
        const result = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    }
    catch{
        res.status(403).send("Invalid token");
        return;
    }
    if (!req.file) {
        res.status(400).send('No file selected');
        return;
    }
    // Check against integrity criteria
    if ((req.file.length > ALLOWED_FSIZE) || (req.file.mimetype !== 'text/csv')) {
        fs.unlinkSync(req.file.path);
        res.status(400).send('Only csv files with size bellow 5KB are allowed.')
        return;
    }
    const filteredData = [];
    const reader = fs.createReadStream(req.file.path)
        .pipe(csvParser({ headers: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] }))
        .on('data', (data) => {
            if (
                (Object.keys(data).length == 6) &&
                Object.values(data).every(value => value != '')
            ) {
                filteredData.push(data);
            } else {
                reader.destroy();
                res.send({ status: 'ERROR', line: filteredData.length + 1 }).end()
            }
        })
        .on('finish', async () => {
            let skipped = 0;
            let inserted = 0;
            for (let i = 0; i < filteredData.length; i++) {
                const singleton = filteredData[i];
                // Check if intnr already exists
                const match = await db.collection('customers').findOne({ intnr: singleton['A'] });
                if ((match != null) && !match.contact_persons.find(obj => obj.email == singleton['D'])) { // If customer exists
                    // Check if contact person is already registered under this Customer to prevent dupilicates
                    // Search by email base - two persons cannot have the same email.
                    // If it's a new contact => append to sub-document contact_persons
                    db.collection('customers').updateOne({ intnr: singleton['A'] }, {
                        $push: {
                            contact_persons: {
                                first_name: singleton['B'],
                                second_name: singleton['C'],
                                email: singleton['D'],
                                mobile_phone: singleton['E'],
                                birth_date: singleton['F'],
                                address: "N/A"
                            }
                        }
                    })
                    inserted++;
                } else {
                    skipped++;
                }
            }
            res.send({ status: 'OK', appended_rows: inserted}).end();
        })
})

app.post('/upload_addresses', upload.single('file'), async (req, res) => {
    const {token} = req.cookies;
    try{
        const result = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    }
    catch{
        res.status(403).send("Invalid token");
        return;
    }
    if (!req.file) {
        res.status(400).send('No file selected');
        return;
    }
    // Check against integrity criteria
    if ((req.file.length > ALLOWED_FSIZE) || (req.file.mimetype !== 'text/csv')) {
        fs.unlinkSync(req.file.path);
        res.status(400).send('Only csv files with size bellow 5KB are allowed.')
        return;
    }
    const filteredData = [];
    const reader = fs.createReadStream(req.file.path)
        .pipe(csvParser({ headers: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] }))
        .on('data', (data) => {
            if (
                (Object.keys(data).length == 9) &&
                Object.values(data).every(value => value != '')
            ) {
                filteredData.push(data);
            } else {
                reader.destroy();
                res.send({ status: 'ERROR', line: filteredData.length + 1 }).end()
            }
        })
        .on('finish', async () => {
            let skipped = 0;
            let inserted = 0;
            for (let i = 0; i < filteredData.length; i++) {
                const singleton = filteredData[i];
                // Check if intnr already exists
                const match = await db.collection('customers').findOne({ intnr: singleton['A'] });
                if ((match != null) && !match.contact_persons.find(obj => obj.email == singleton['I'])) { // If customer exists
                    // Check if address is already registered under this Customer to prevent dupilicates
                    // Search by email base - two persons cannot have the same email.
                    // If it's a new address => append to sub-document addresses
                    db.collection('customers').updateOne({ intnr: singleton['A'] }, {
                        $push: {
                            addresses: {
                                company_name: singleton['B'],
                                country: singleton['C'],
                                city: singleton['D'],
                                zip: singleton['E'],
                                fax: singleton['F'],
                                phone: singleton['G'],
                                street: singleton['H'],
                                email: singleton['I'],
                            }
                        }
                    })
                    inserted++;

                } else {
                    skipped++;
                }
            }
            res.send({ status: 'OK', appended_rows: inserted}).end();
        })
})



app.post('/remove', authenticateJWT, async (req, res)=>{
    const {intnr} = req.body;
    await db.collection('customers').deleteOne({intnr:intnr});
    res.send({status:'OK'});
})


app.post('/update', authenticateJWT, async (req, res)=>{
    const {intnr, country, first_name, second_name, company, zip, city, address} = req.body;
    await db.collection('customers').updateOne({intnr:intnr}, {
        $set: {
            "addresses.0.country": country,
            "addresses.0.zip": zip,
            "addresses.0.city": city,
            "addresses.0.company_name":company,
            "contact_persons.0.first_name": first_name,
            "contact_persons.0.second_name": second_name,
            "contact_persons.0.address": address,
        }
    });
    res.send({status:'OK'}); 
})

app.post('/authenticate', async (req, res) => {
    const { username, password } = req.body;
    // Make sure provided username(email) is in a proper and safe format to process.
    if (
        !username ||
        !validator.isEmail(username) ||
        (username.length > 30)
    ) {
        res.send({
            status: 'ERROR',
            message: 'Username has an invalid format.' + username
        })
        return;
    }
    const result = await db.collection("users").findOne({
        $and: [
            {
                email: username
            },
            {
                password_hash: crypto.createHash('sha256').update(password).digest('hex').slice(0, 32)
            }
        ]
    });
    if (result == null) {
        res.send({
            status: 'ERROR',
            message: 'Invalid credentials.'
        })
    } else {
        // Update updated_at field
        const ts=new Date().toISOString();
        db.collection("users").updateOne({ _id: new ObjectId(result._id) }, { $set: { updated_at: ts } })
        // Create JWT token
        const token = jwt.sign({ username: username }, secretKey, { expiresIn: '1d' });
        
        res.send({
            status: 'OK',
            token: token,
            id: result._id,
            account_name: result.first_name + ' ' + result.last_name,
            last_login: ts,
        });
    }
})

// Security measure : only handful of allowed fields that can construct the query.
const ALLOWED_QUERY_FIELDS = ['intnr', 'type', 'contact_persons.first_name', 'contact_persons.second_name', 'contact_persons.email', 'addresses.company_name','addresses.country', 'addresses.zip', 'addresses.city','addresses.street'];
app.get('/pull', authenticateJWT, async (req, res)=>{
    // Check if query object is valid.
    if (!Object.keys(req.query).every(key=>ALLOWED_QUERY_FIELDS.indexOf(key)>=0)){
        res.send({status:'ERROR', reason:'Unaccepted query field.'});
        return;
    }
    const query = {...req.query};
    const result = await db.collection('customers').find(query).map(doc=>({
        intnr: doc['intnr'],
        country: doc['addresses'][0]['country'],
        first_name: doc['contact_persons'][0]['first_name'],
        second_name: doc['contact_persons'][0]['second_name'],
        company: doc['addresses'][0]['company_name'],
        zip: doc['addresses'][0]['zip'],
        city: doc['addresses'][0]['city'],
        address: doc['contact_persons'][0]['address']
    })).toArray();
    if(result.length>0){
        res.send({status:'OK', data:result})
    }else{
        res.send({status:'OK', data:[]})
    }
})

app.listen(port, async () => {
    console.log(`[i] Establishing database connection.`)
    await client.connect();
    console.log(`[~] Database connection maintained.`)
    console.log(`[~] HTTP server is listing on port ${port}.`)
})