const express = require('express');
const app = express();
const cors = require('cors');
const studentRoutes = require('./routes/userRoutes/student');
require('dotenv').config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    res.send("Hello")
})

// Routes
app.use('/api/students', studentRoutes);


module.exports = app;


