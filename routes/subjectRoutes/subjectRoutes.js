const express=require('express');
const router=express.Router();
const subjectController=require("../../controllers/subjectController/subjectController");

router.get("/subject-form", subjectController.loadSubjectForm);
router.post("/subject-form", subjectController.addOrUpdateSubject);
router.get("/delete-subjects/:id", subjectController.deleteSubject);
router.get("/sections/:classId", subjectController.getSectionsByClass);

module.exports=router;