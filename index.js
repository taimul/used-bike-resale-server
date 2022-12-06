const express = require('express');
const cors = require('cors');
let jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

//middlewares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.d7ug9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader, "authheader");
    if (!authHeader) {
        return res.status(401).send("unauthorized access");
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        console.log(err);
        if (err) {
            return res.status(403).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
}

app.get('/', (req, res) => {
    res.send('service review server is running');
})

async function run() {

    try {
        const categoriesDataCollection = client.db("bikePortal").collection("categoriesData");
        const bikes = client.db("bikePortal").collection("bikes");
        const bookingsCollection = client.db("bikePortal").collection("booking");
        const usersCollection = client.db("bikePortal").collection("users");
       

        // create token

        app.get("/jwt", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
                    expiresIn: "1h",
                });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: "" });
        });

        // create user
        app.post("/users", async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        //get category data
        app.get("/categoriesData", async (req, res) => {
            const query = {};
            const datas = await categoriesDataCollection.find(query).toArray();
            res.send(datas);
        });
        //get product details
        app.get("/bikes/:name", async (req, res) => {
            const name = req.params.name;
            const query = { category_name: name };
            const result = await bikes.find(query).toArray();
            res.send(result);
        });
        // booking collection

        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // my booking
        app.get("/bookings", async (req, res) => {
            const email = req.query.email;
           
            const query = { email: email };
            const booking = await bookingsCollection.find(query).toArray();
            res.send(booking);
        });
        // get all seller
        app.get("/allusers", async (req, res) => {
            const role = req.query.role;
            const query = { role: role };
            const allusers = await usersCollection.find(query).toArray();
            res.send(allusers);
        });
        // get all users
        app.get("/users", async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        // delete user
        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });
        // delete seller 

        app.delete("/seller/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        // admin check ?
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        });


        const verifyAdmin = async (req, res, next) => {
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user?.role !== "admin") {
                return res.status(403).send({ message: "forbidden access" });
            }
            next();
        };

            // verifyBuyer

            const verifyBuyer = async (req, res, next) => {
            
              const query = { email: email };
              const user = await usersCollection.findOne(query);

              if (user?.role !== "buyer") {
                return res.status(403).send({ message: "forbidden access" });
              }
              next();
            };

            //   veryfy Seller

            const verifySeller= async (req, res, next) => {
           
              const query = { email: email };
              const user = await usersCollection.findOne(query);

              if (user?.role !== "seller") {
                return res.status(403).send({ message: "forbidden access" });
              }
              next();
            };
     // Buyer check

     app.get("/users/buyer/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };      
        const user = await usersCollection.findOne(query);
        // console.log({ isBuyer: user?.role === "buyer" })
        res.send({ isBuyer: user?.role === "buyer" });
      });

      // seller check

      app.get("/users/seller/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };      
        const user = await usersCollection.findOne(query);
        res.send({ isSeller: user?.role === "seller" });
      });


    } finally {
    }
}
run().catch(err => console.error(err))

app.listen(port, () => {
    console.log(`service review server running on ${port}`)
})