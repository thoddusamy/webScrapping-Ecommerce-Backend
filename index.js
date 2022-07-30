const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient
const cors = require("cors");
const dotenv = require("dotenv").config();
const URL = process.env.DB_url;
const bcryptjs = require("bcryptjs");
const jwt = require('jsonwebtoken')
const secret = process.env.secret

app.use(express.json())

app.use(cors({
    origin: "*"
}))

const authenticate = function (req, res, next) {
    if (req.headers.authorization) {
        let verify = jwt.verify(req.headers.authorization, secret);
        if (verify) {
            next()
        } else {
            res.status(401).json({
                message: "Unauthorized!"
            })
        }
    } else {
        res.status(401).json({
            message: "Unauthorized!"
        })
    }
}

app.get('/', async (req, res) => {
    res.send("Server is Running Perfectly 🏃‍♂️")
})

app.get('/allproducts', authenticate, async (req, res) => {
    try {
        const connection = await mongoClient.connect(URL)
        const db = connection.db("web_scraping")
        const getData = await db.collection("products").find().toArray()
        connection.close()
        res.json(getData)
    } catch (error) {
        console.log(error);
    }
})

app.post('/productOne', authenticate, async (req, res) => {
    try {
        const connection = await mongoClient.connect(URL)
        const db = connection.db("web_scraping")
        await db.collection("products").insertOne(req.body)
        connection.close()
        res.json({
            message: "product Added SuccessFully!"
        })
    } catch (error) {
        console.log(error);
    }
})

app.post("/register", async (req, res) => {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db("web_scraping");
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt)
        req.body.password = hash
        await db.collection("registered_users").insertOne(req.body);
        connection.close()
        res.json({
            message: "Registered Successfully!"
        })
    } catch (error) {
        alert("Error!")
    }

})

app.post('/login', async (req, res) => {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("web_scraping");

    const user = await db.collection("registered_users").findOne({ username: req.body.username })

    if (user) {
        const match = await bcryptjs.compare(req.body.password, user.password)
        if (match) {
            //jwt token
            const token = jwt.sign({ _id: user._id }, secret);
            res.status(200).json({
                message: "LoggedIn Successfully 😍",
                token: token
            })
        } else {
            res.status(401).json({
                message: "Password Incorrect ❌"
            })
        }
    } else {
        res.status(401).json({
            message: "User not found ☹️"
        })
    }

    connection.close()

})

app.listen(process.env.PORT || 3555)