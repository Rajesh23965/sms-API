const express = require("express");
const router = express.Router();

const examController = require("../../controllers/ExamController/exam");

router.get("/exam-form", examController.loadExamForm);
router.post("/save", examController.saveTerm);
router.get("/delete", examController.deleteTerm);
router.get("/exam-form-type", examController.loadExamTypeForm);
router.post("/api/savemarks", examController.addstudentsMarks);

// Exam operations
router.post("/exam/create", examController.createExam);

// blow routes are for Exam to search Data
router.get('/api/bulk-marks-data', examController.getBulkMarksData);
router.post('/api/save-bulk-marks', examController.saveBulkMarks);
router.get("/api/search", examController.searchresult);
router.get('/api/sections-by-class', examController.getSectionsByClass);
module.exports = router;
