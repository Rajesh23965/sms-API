const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
    res.send("Hello")
})

// Routes
 app.use('/api/students', require('./routes/userRoutes/student'));


module.exports = app;


