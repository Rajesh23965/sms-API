const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware and settings
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");

// Import and use routes
const loginRoute = require("./routes/loginRoute");
app.use("/", loginRoute); // Now /login works

app.get("/", (req, res) => {
  res.send("Hello");
});

module.exports = app;
