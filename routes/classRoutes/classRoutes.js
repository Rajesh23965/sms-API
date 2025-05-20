const express = require("express");
const router = express.Router();
const classesController = require("../../controllers/classController/class");

router.get("/class-form", classesController.loadClassForm);
router.post("/api/classes", classesController.addorupdateClass);
router.get("/delete-class/:id", classesController.deleteClass);
router.get("/count", classesController.getTotalClass);
router.post("/get-sections", classesController.getSectionsByClasses);
router.post("/get-subjects", classesController.getSubjectsByClassAndSections);
router.get('/api/subject-details/:id', classesController.viewClassDetails);
router.post("/api/subject-details/:subjectId",classesController.subjectDetails);

module.exports = router;
