const express = require("express");
const router = express.Router();

const examController = require("../../controllers/ExamController/exam");

router.get("/exam-form", examController.loadExamForm);
router.post("/api/create-exam-type", examController.addorupdateExamType);
router.get("/api/delete-examtype", examController.deleteExamType);

module.exports = router;
