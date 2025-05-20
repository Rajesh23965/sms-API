const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../../models");

const sectionController = require("../../controllers/sectionController/section");

router.get("/section-form", sectionController.loadsectionform);
router.post("/api/add-section", sectionController.addorupdateSection);
router.get("/delete-section/:id",sectionController.deleteSection);

module.exports = router;
   