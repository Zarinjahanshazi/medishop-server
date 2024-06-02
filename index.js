const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://mediUser:m5KBmjoNAUBdm3Wz@cluster0.s8jaol5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
    // await client.connect();

    const userCollection = client.db("mediShop").collection("users");
    const categoryCollection = client.db("mediShop").collection("categories");
    const queriesCollection = client.db("mediShop").collection("queries");
    const mainCategoryCollection = client.db("mediShop").collection("maincategory");


     //user related API
     app.get('/users',async(req,res) =>{
        const result = await userCollection.find().toArray();
        res.send(result);
    });

    app.post("/users", async (req, res) => {
        const user = req.body;
  
        const result = await userCollection.insertOne(user);
        res.send(result);
      });

      //queries related API
      app.get('/queries',async(req,res) =>{
        const result = await queriesCollection.find().toArray();
        res.send(result);
    });

      //categories related API
      app.get('/categories',async(req,res) =>{
       
        const result = await categoryCollection.find().toArray();
        res.send(result);
    });
    app.get('/categories/:category', async (req, res) => {
        const category = req.params.category;
        const query = { category: category };
        const result =  await categoryCollection.find(query).toArray();
        // const result = await cursor.toArray();
        res.send(result);
    });
    // app.get('/categories/:discount', async (req, res) => {
    //     const category = req.params.category;
    //     const query = { category: category };
    //     const result =  await categoryCollection.find(query).toArray();
    //     // const result = await cursor.toArray();
    //     res.send(result);
    // });


    // main category related api
    app.get("/maincategory", async (req, res) => {
        const result = await mainCategoryCollection
          .aggregate([
            {
              $lookup: {
                from: "categories",
                localField: "name",
                foreignField: "category",
                as: "medicine",
              },
            },
            {
              $addFields: {
                categoriesCount: { $size: "$medicine" },
              },
            },
            {
              $project: {
                medicine: 0,
              },
            },
          ])
          .toArray();
        res.send(result);
      });
    // app.get('/categories/:category', async (req, res) => {
    //     const category = req.params.category;
    //     const query = { category: category };
    //     const cursor =  await categoryCollection.find(query);
    //     const result = await cursor.toArray();
    //     res.send(result);
    // });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) =>{
    res.send('medi World!')
}) 
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`)
})