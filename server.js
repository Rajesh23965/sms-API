require("dotenv").config();
const app = require("./app");
const db = require("./models"); // database
const PORT = process.env.PORT || 5001;

db.sequelize
  .authenticate()
  // .then(() => {
  //     console.log('Database connected...');
  //     return db.sequelize.sync({ alter: true });
  // })
  .then(() => {
    console.log("Database synced");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
