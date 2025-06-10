// In result routes file (routes/result.js), add the missing endpoint:
const express = require("express");
const router = express.Router();
const resultController = require("../../controllers/ResultController/resultController");
const { authMiddleware } = require("../../middleware/authMiddleware");

router.get("/results", authMiddleware, resultController.loadResult);
router.get("/api/student-result", authMiddleware, resultController.searchStudentResult);
router.get("/api/class-results", authMiddleware, resultController.getClassResults);
router.get('/api/sections-by-class', authMiddleware, resultController.getSectionsByClass);

module.exports = router;
