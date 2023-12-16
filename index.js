const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

const corsOptions ={
    origin:'*', 
    credentials:true,
    optionSuccessStatus:200,
 }

// middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ve1ztfj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) =>{
    // console.log('hitting verify JWT');
    // console.log(req.headers.authorization);
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    // console.log('token inside verify JWT', token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if(error){
            return res.status(401).send({error: true, message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const taskCollection = client.db('taskManagement').collection('task');
        const cartCollection = client.db('taskManagement').collection('carts');

        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({token});

        })

        //tasks
        app.get('/tasks',  async (req, res) => {
            // console.log(req.headers.authorization);
            // console.log("come back after verity")
            const cursor = taskCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // need some data email data
        
        app.get('/allTasks', async (req, res) => {
            // console.log(req.headers.authorization);
            
            // const cursor = taskCollection.find();
            // const result = await cursor.toArray();
            // let query = {};
            // if(res.query?.email){
            //     query = {email: req.query.email}
            // }
            const result = await taskCollection.find({}).toArray();
            res.send(result);
        })

        app.get('/tasksDetails/:id', async (req,res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await taskCollection.findOne(query);
            res.send(result);
        })

        app.post('/tasks', async (req, res) => {
            const task = req.body;
            console.log('new task', task);
            const result = await taskCollection.insertOne(task);
            res.send(result);
        })


        // cart collection api
        app.get('/carts', async (req, res) =>{
            const email = req.query.email;
            if (!email){
                res.send([]);
            }
            const query = {email: email};
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });


        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })

        app.delete('/carts/:id', async(req, res) =>{
            const id = req.params.id;
            console.log(id);
            const query = {_id: new ObjectId(id)}
            // console.log(query);

            const result = await cartCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        })

        app.put('/tasksDetails/:id', async(req, res)=>{
            const id = req.params.id;
            const task = req.body;
            console.log(task);
            const filter = {_id: new ObjectId(id)}
            const options = { upsert: true};
            const updatedTask = {
                $set: {
                    title: task.title,
                    date: task.date,
                    rating: task.rating,
                    details: task.details,
                    picture: task.picture,
                }
            }
            const result = await taskCollection.updateOne(filter, updatedTask, options);
            res.send(result);
        })

        app.delete('/tasks/:id', async(req, res) =>{
            const id = req.params.id;
            console.log(id);
            const query = {_id: new ObjectId(id)}
            console.log(query);

            const result = await taskCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Task Management System is running')
})

app.listen(port, () => {
    console.log(`Task Management System is running on port ${port}`)
})