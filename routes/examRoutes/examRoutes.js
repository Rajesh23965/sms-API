const express = require("express");
const router = express.Router();

const examController = require("../../controllers/ExamController/exam");

router.get("/exam-form", examController.loadExamForm);
router.get("/exam-form-type", examController.loadExamTypeForm);
router.get("/api/delete-examtype", examController.deleteExamType);
router.post("/api/create-exam-type", examController.addorupdateExamType);

// blow routes are for Exam to search Data

router.get("/api/search", examController.searchresult);

module.exports = router;
