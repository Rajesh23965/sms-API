const express = require("express");
const router = express.Router();

const loginController = require("../../controllers/loginController/login");

router.get("/", loginController.loadloginform);

module.exports = router;
