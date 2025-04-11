const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
app.use(cors());
app.use(express.json());


app.get("/", async (req, res) => {
    res.send("Hello")
})


module.exports = app;
