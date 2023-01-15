const express = require('express');
const app = express();
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gmphtow.mongodb.net/?retryWrites=true&w=majority`;
 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 


function verifyJWT(req, res, next){ 
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send('Unauthorized Access')
    }

    const token = authHeader.split(' ')[1]; 

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded) {
        if(err){
            return res.status(403).send('forbidden access')
        }
        req.decoded = decoded;
        next();
    });
}


async function run(){
    try{ 

        await client.connect(); 
        const categoryCollection = client.db('hakilFurniture').collection('categoryFurniture');
        const bookingCollection = client.db('hakilFurniture').collection('bookings');
        const userCollection = client.db('hakilFurniture').collection('users');


        // GET API ALL category
        app.get('/services', async(req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        // GET API by id
        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await categoryCollection.findOne(query);
            res.send(result)
        });

        // POST API Bookings 
        app.post('/booking', async(req, res) => {
            const book = req.body;
            const booking = await bookingCollection.insertOne(book);
            res.send(booking);
        });

        //GET API booking filter by email
        app.get('/booking', verifyJWT, async(req, res) => {
            const email = req?.query?.email; 
            const decodedEmail = req?.decoded?.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden Access'})
            }

            const filter = {userEmail: email};
            const result = await bookingCollection.find(filter).toArray();
            res.send(result);
        });

        // JWT Implement GET API
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await userCollection.findOne(query);
            if(user){
                const token = jwt.sign({ email: email },  process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token});
            } 
            res.status(403).send({accessToken: 'Unauthorized access'});
        })

        // POST API Register Users
        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // GET API all users
        app.get('/users', async(req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users)
        });
        
        // Make admin PUT API
        app.put('/users/admin/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })



    }finally{

    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hakil furniture hello!')
});
 



app.listen(port, () => {
    console.log( `Hakil Furniture server is Running port: ${port}`)
})