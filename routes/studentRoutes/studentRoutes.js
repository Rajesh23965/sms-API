const express = require("express");
const router = express.Router();
const db=require("../../models");
const studentController = require("../../controllers/studentController/student");
const { studentUpload }=require("../../middleware/upload.js");

const District = db.district;
const Vdc = db.vdc;
const Section = db.sections;
router.get("/student-form", studentController.loadStudentForm);
router.get("/student-list", studentController.loadStudentList);
router.get("/count", studentController.getTotalStudents);

router.get("/delete-class/:id", studentController.deleteStudent);
router.post(
  "/api/students",
  studentUpload.single("image"),
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
      where: { class_id: req.params.classId },
    });
    res.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch section" });
  }
});

module.exports = router;
