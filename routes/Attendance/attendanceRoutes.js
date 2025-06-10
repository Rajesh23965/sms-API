const express=require("express");

const router=express.Router();
const attendanceController=require("../../controllers/Attendance/attendanceController");

// Attendance routes
router.get('/', attendanceController.loadAttendanceForm);
// router.get('/students',  attendanceController.getStudentsByClassSection);
// router.post('/mark',  attendanceController.addAttendance);
// router.get('/report',  attendanceController.viewAttendanceReport);


module.exports=router;



