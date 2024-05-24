const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;


app.use(express.json())
app.use(cors())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p2unx4b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const database = client.db("bistroDB");
    const menuCollection = database.collection("menu");
    const usersCollection = database.collection("users");
    const reviewsCollection = database.collection("reviews");
    const cartsCollection = database.collection("carts");

    // Jwt
    app.post('/jwt',async(req,res)=>{
      const userInfo = req.body
      const token = jwt.sign(userInfo,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.send({token})
    })

    // verify Token middelware
    const verifyToken = (req,res,next) => {
      // console.log('inside verifyToken',req.headers);
      if(!req.headers.authorization){
        res.status(403).send({message:'Forbidden Access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      // console.log('inside veryfiy token barear',token);
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decode)=>{
        if(error){
          return res.status(403).send({message:'Forbidden Access'})
        }
        req.decode = decode
        next()
      })
    }
    // verify Admin
    const verifyAdmin = async (req,res,next) => {
      const email = req.decode.email
      const query = {
        email:email
      }
      const user = await usersCollection.findOne(query)
      const isAdmin = user?.role === 'Admin'
      if(!isAdmin){
        return res.status(403).send({message:'Forbidden Access'})
      }
      next()
    }

    // user related api
    app.post('/user',async(req,res)=>{
      const user = req.body;
      // const option = {upsert:true}
      const query = {
        email:user?.email
      }
      if(!user.email){
       return res.send({message:'email not found'})
      }
      const isExist = await usersCollection.findOne(query)
      if(isExist){
        return res.send(isExist)
      }else{
        const result = await usersCollection.insertOne(user)
        return res.send(result)
      }
      console.log(user);

    })
    // get all user
    app.get('/user',verifyToken,async(req,res)=>{
      
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    // make admin
    app.patch('/user/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {
        _id : new ObjectId(id)
      }
      const updateDoc = {
        $set:{
          role:'Admin'
        }
      }
      const result = await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })

    // get Admin 
    app.get('/users/admin/:email',verifyToken,async(req,res)=>{
      const email = req.params.email;
      if(email !== req.decode.email){
        return res.status(403).send({message:'Unauthorized Access'})
      }
      const query = {
        email: email
      }
      const user = await usersCollection.findOne(query)
      let admin = false
      if(user){
        admin = user?.role === 'Admin'
      }
      res.send({admin})
    })



    // Delete User 
    app.delete('/user/:id',async(req,res)=>{
      const id = req.params.id
      const query = {
        _id :new ObjectId(id)
      }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    // menu related api
    app.post('/addmenu',async(req,res)=>{
      const item = req.body
      const result = await menuCollection.insertOne(item);
      res.send(result)
    })
    
    app.get('/menu',async(req,res)=> {
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    app.delete('/menu/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {
        _id :new ObjectId(id)
      }
      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })

    app.get('/reviews',async(req,res)=>{
        const result = await reviewsCollection.find().toArray()
        res.send(result)
    })


    app.get('/carts',async(req,res)=> {
      const email = req.query.email
      let query = {}
      if(email){
        query = {
          email: email
        }
      }
      const result = await cartsCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/carts',async(req,res)=> {
      const cart = req.body
      const result = await cartsCollection.insertOne(cart);
      res.send(result)
    })

    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await cartsCollection.deleteOne(query)
      res.send(result)
    })
    


    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',async(req,res)=> {
    res.send('Server is Running')
})

app.listen(port,()=> {
    console.log(`server is Running no${port}`);
})
