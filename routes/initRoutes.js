const express = require("express");
const router = express.Router();

const studentRoutes = require("./studentRoutes/studentRoutes");
const classRoutes = require("./classRoutes/classRoutes");
const teacherRoutes = require("./teacherRoutes/teacherRoutes");
const sectionRoutes = require("./sectionRoutes/sectionRoutes");
const loginRoutes = require("./loginRoutes/loginRoutes");
const examRoutes = require("./examRoutes/examRoutes");
const subjectRoutes = require("./subjectRoutes/subjectRoutes");
const resultRoutes=require("./resultRoutes/resultRoutes");
const renewStudentRoutes=require("./RenewRoutes/renewStudentRouts")
router.use("/students", studentRoutes);
router.use("/classes", classRoutes);
router.use("/teachers", teacherRoutes);
router.use("/sections", sectionRoutes);
router.use("/subjects", subjectRoutes);
router.use("/exams", examRoutes);
router.use("/login", loginRoutes);
router.use("/results",resultRoutes);
router.use("/promotion",renewStudentRoutes);

module.exports = (app) => {
  app.use("/", router);
};
