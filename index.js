const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const reviewsCollection = database.collection("reviews");
    const cartsCollection = database.collection("carts");

    
    app.get('/menu',async(req,res)=> {
        const result = await menuCollection.find().toArray()
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
