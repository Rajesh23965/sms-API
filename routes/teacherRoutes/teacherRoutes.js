const express = require("express");
const router = express.Router();
const teacherController = require("../../controllers/teacherController/teacher");

router.get("/teacher-form", teacherController.loadteacherform);
router.post("/api/teacher", teacherController.addorupdateteacher);
router.get("/teacher-list", teacherController.loadteacherlist);

module.exports = router;
