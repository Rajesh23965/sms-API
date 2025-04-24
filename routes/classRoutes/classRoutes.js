const express = require("express");
const router = express.Router();
const classesController = require("../../controllers/classController/class");

router.get("/class-form", classesController.loadClassForm);
router.post("/api/classes", classesController.addorupdateClass);
router.get("/delete-class/:id",classesController.deleteClass);
module.exports = router;
