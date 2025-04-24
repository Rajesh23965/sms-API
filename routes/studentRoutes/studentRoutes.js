const express = require("express");
const router = express.Router();
const path = require("path");

const studentController = require("../../controllers/studentController/student");
const db = require("../../models");
const multer = require("multer");

// Setup file upload using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const District = db.district;
const Vdc = db.vdc;
const Section = db.sections;
router.get("/student-form", studentController.loadStudentForm);
router.get("/student-list", studentController.loadStudentList);
router.get("/delete-class/:id", studentController.deleteStudent);
router.post(
  "/api/students",
  upload.single("image"),
  studentController.addOrUpdateStudent
);

router.get("/get-districts/:provinceId", async (req, res) => {
  try {
    const districts = await District.findAll({
      where: { province_id: req.params.provinceId },
      raw: true,
    });
    res.json(districts);
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ message: "Failed to fetch districts" });
  }
});

router.get("/get-vdcs/:districtId", async (req, res) => {
  try {
    const vdcs = await Vdc.findAll({
      where: { district_id: req.params.districtId },
    });
    res.json(vdcs);
  } catch (error) {
    console.error("Error fetching vdcs:", error);
    res.status(500).json({ message: "Failed to fetch vdcs" });
  }
});

router.get("/get-sections/:classId", async (req, res) => {
  try {
    const sections = await Section.findAll({
      where: { class_id: req.params.classId }, // FIXED
    });
    res.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch section" });
  }
});


module.exports = router;
