const express = require("express");
const router = express.Router();
const { teacherUpload } = require('../../middleware/upload');
const teacherController = require("../../controllers/teacherController/teacher");

router.get("/teacher-form", teacherController.loadteacherform);
router.post("/api/teacher", teacherUpload.single('image'), teacherController.addorupdateteacher);
router.get("/teacher-list", teacherController.loadteacherlist);
router.post("/get-sections", teacherController.getSectionsByClasses);
router.post("/get-subjects", teacherController.getSubjectsBySections);
router.get("/delete-teachers/:id", teacherController.deleteTeacher);
router.get("/count", teacherController.getTotalTeacher);

module.exports = router;

