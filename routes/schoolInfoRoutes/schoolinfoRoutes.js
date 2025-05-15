const express=require("express");
const router=express.Router();
const schoolInfo=require("../../controllers/SchoolInfo/schoolInfoController");
const { schoolUpload } = require("../../middleware/upload");

router.get("/school-form",schoolInfo.loadSchoolInfoForm);
router.post("/api/schoolinfo",schoolUpload.single("image"), schoolInfo.addOrUpdateSchoolInfo);
// router.get("/delete-record/:id", schoolInfo.deleteSchoolInfo);
router.post("/delete-record/:id", schoolInfo.deleteSchoolInfo);
module.exports=router;