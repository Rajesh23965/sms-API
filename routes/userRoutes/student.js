const express = require("express");
const router = express.Router();
const {addStudent}=require("../../controllers/userController/student")


router.post("/",addStudent);