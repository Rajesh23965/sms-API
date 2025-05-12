// In result routes file (routes/result.js), add the missing endpoint:
const express = require("express");
const router = express.Router();
const resultController = require("../../controllers/ResultController/resultController");

router.get("/results", resultController.loadResult);
router.get("/api/student-result", resultController.searchStudentResult);
router.get("/api/class-results", resultController.getClassResults);

module.exports = router;