const express = require("express");
const router = express.Router();

const studentRoutes = require("./studentRoutes/studentRoutes");
const classRoutes = require("./classRoutes/classRoutes");
const teacherRoutes = require("./teacherRoutes/teacherRoutes");
const sectionRoutes = require("./sectionRoutes/sectionRoutes");
const loginRoutes = require("./loginRoutes/loginRoutes");
const examRoutes = require("./examRoutes/examRoutes");
const subjectRoutes = require("./subjectRoutes/subjectRoutes");
const resultRoutes = require("./resultRoutes/resultRoutes");
const renewStudentRoutes = require("./RenewRoutes/renewStudentRouts");
const schoolInfoRoutes = require("./schoolInfoRoutes/schoolinfoRoutes");
const attendanceRoutes = require("./Attendance/attendanceRoutes")
const roleRoutes = require("./Admin/roleRoutes");
const adminRoutes = require("./Admin/adminRoutes");
const layoutRoutes = require("./homeLayout/layoutRoutes");
router.use("/admin", adminRoutes);
router.use("/students", studentRoutes);
router.use("/classes", classRoutes);
router.use("/teachers", teacherRoutes);
router.use("/sections", sectionRoutes);
router.use("/subjects", subjectRoutes);
router.use("/exams", examRoutes);
router.use("/login", loginRoutes);
router.use("/results", resultRoutes);
router.use("/promotion", renewStudentRoutes);
router.use("/school", schoolInfoRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/role", roleRoutes);
router.use("/home-layout", layoutRoutes);
module.exports = (app) => {
  app.use("/", router);
};
