const express = require("express");
const router = express.Router();

const studentRoutes = require("./studentRoutes/studentRoutes");
const classRoutes = require("./classRoutes/classRoutes");
const teacherRoutes = require("./teacherRoutes/teacherRoutes");
const sectionRoutes = require("./sectionRoutes/sectionRoutes");
const loginController = require("./loginRoutes/loginRoutes");

router.use("/students", studentRoutes);
router.use("/classes", classRoutes);
router.use("/teachers", teacherRoutes);
router.use("/sections", sectionRoutes);
router.use("/login", loginController);

module.exports = (app) => {
  app.use("/", router);
};
