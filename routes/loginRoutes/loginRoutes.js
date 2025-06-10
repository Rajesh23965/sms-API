const express = require("express");
const router = express.Router();

const loginController = require("../../controllers/loginController/login");
const { verifyToken, authMiddleware } = require("../../middleware/authMiddleware");

router.get("/", loginController.loadloginform);
router.post("/", loginController.login);

router.get("/me", verifyToken, loginController.checkUser);
router.post("/logout", loginController.logout);
module.exports = router;


