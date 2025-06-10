const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const initRoutes = require("./routes/initRoutes");
const layoutMiddleware = require("./middleware/layoutMiddleware");
const { authMiddleware } = require("./middleware/authMiddleware");
const authenticate = require("./middleware/auth");
require("dotenv").config();

const app = express();
//dynamic sidebar
app.use(cookieParser());
app.use(authenticate);
app.use(layoutMiddleware);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static('public/uploads'));
app.locals.formatDate = (date) => {
  return date ? new Date(date).toDateString() : 'N/A';
};
app.use(flash());

app.use(
  session({
    secret: "school Management System secret key",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to expose session variables to EJS views
app.use((req, res, next) => {
  res.locals.error = req.session.error || "";
  res.locals.success = req.session.success || "";
  res.locals.oldInput = req.session.oldInput || {};
  res.locals.currentPath = req.path;
  next();
});


initRoutes(app);

// Dashboard route
app.get("/", authMiddleware, (req, res) => {
  res.render("dashboard");
});



// 404 handler
app.use((req, res) => {
  res.status(404).render("404");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
