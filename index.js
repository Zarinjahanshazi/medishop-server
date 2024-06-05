const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const cartCollection = client.db("mediShop").collection("carts");
    const paymentCollection = client.db("mediShop").collection("paymentHistory");

    //   jwt related Api
    app.post("/jwt", async (req, res) => {
        const body = req.body;
        const user = await userCollection.findOne({ email: body.email });
        const userData = {
          email: user.email,
          role: user.role,
        };
        if (user) {
          const token = jwt.sign(userData, process.env.PRIVET_KEY, {
            expiresIn: 60 * 60,
          });
          res.send({ token });
        }
      });
    const verifyJWT = (req, res, next) => {
        const token = req.headers.authorization;
        if (!token) {
          return res.status(401).send({ error: true, message: "unauthorized" });
        }
        jwt.verify(token, process.env.PRIVET_KEY, (error, decoded) => {
          if (error) {
            return res.status(401).send({ error: true, message: "unauthorized" });
          }
          req.decoded = decoded;
          next();
        });
      };
      
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

      app.get("/me", async (req, res) => {
        const { email } = req.query;
        const result = await userCollection.findOne(
          { email: email },
          { projection: { name: 0, photo: 0 } }
        );
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
    // send medicine in database by seller
    app.post("/category", async (req, res) => {
        const data = req.body;
        try {
          const result = await categoryCollection.insertOne(data);
          res.json(result);
        } catch (error) {
          res.json(error);
        }
      });
    //   get medicine from database add by seller
      app.get('/category',async(req,res) =>{
        const result = await categoryCollection.find().toArray();
        res.send(result);
    });


    // payment
    app.post("/create-payment-intent", async (req, res) => {
        try {
          const { price } = req.body;
          console.log(price);
          if (!price || typeof price !== "number") {
            return res.status(400).send({ error: "Invalid price value" });
          }
          const amount = price * 100;
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ["card"],
          });
  
          console.log(paymentIntent);
          res.send({
            clientSecret: paymentIntent.client_secret,
          });
        } catch (error) {
          console.error("Error creating payment intent:", error);
          res.status(500).send({ error: "Failed to create payment intent" });
        }
      });
  
      app.post("/paymentH", async (req, res) => {
        const data = req.body;
        const result = await paymentCollection.insertOne(data);
        res.send(result);
      });
    // app.get('/categories/:discount', async (req, res) => {
    //     const category = req.params.category;
    //     const query = { category: category };
    //     const result =  await categoryCollection.find(query).toArray();
    //     // const result = await cursor.toArray();
    //     res.send(result);
    // });
    app.get('/discounts', async (req, res) => {
        try {
            const query = { discount: { $gt: 0 } };
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        } catch (error) {
            console.error(error);
            res.status(500).send('An error occurred while fetching discounted products');
        }
    });


    //cart related api
    app.post('/carts', async(req,res) =>{
        const cartItem = req.body;
        const result = await cartCollection.insertOne(cartItem);
        res.send(result);
    });
    
    // main category related api
    app.get("/maincategory", async (req, res) => {
        try {
          const result = await mainCategoryCollection
            .aggregate([
              {
                $lookup: {
                  from: "categories",
                  localField: "name",
                  foreignField: "category",
                  as: "medisine",
                },
              },
              {
                $addFields: {
                  categoriesCount: { $size: "$medisine" },
                },
              },
              {
                $project: {
                  medisine: 0,
                },
              },
            ])
            .toArray();
          console.log(result);
          res.send(result);
        } catch (error) {
          res.send(error);
        }
      });

    
    // app.get('/categories/:category', async (req, res) => {
    //     const category = req.params.category;
    //     const query = { category: category };
    //     const cursor =  await categoryCollection.find(query);
    //     const result = await cursor.toArray();
    //     res.send(result);
    // });
      //queries related API
    //   app.get('/queries',async(req,res) =>{
    //     const result = await queriesCollection.find().toArray();
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