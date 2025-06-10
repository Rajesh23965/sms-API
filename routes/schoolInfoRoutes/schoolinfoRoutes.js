const express=require("express");
const router=express.Router();
const schoolInfo=require("../../controllers/SchoolInfo/schoolInfoController");
const { schoolUpload } = require("../../middleware/upload");
const {authMiddleware} = require("../../middleware/authMiddleware");

router.get("/school-form",authMiddleware,schoolInfo.loadSchoolInfoForm);
router.post("/api/schoolinfo",authMiddleware,schoolUpload.single("image"), schoolInfo.addOrUpdateSchoolInfo);
// router.get("/delete-record/:id", schoolInfo.deleteSchoolInfo);
router.post("/delete-record/:id",authMiddleware, schoolInfo.deleteSchoolInfo);
module.exports=router;