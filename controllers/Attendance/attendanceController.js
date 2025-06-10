const db=require("../../models");
const Attendance=db.attendance;
const AttendanceSummary=db.attendance_summary;
const HolidayLeave=db.holidays_leaves;


const loadAttendanceForm=(req,res)=>{
try {
    
    res.render("attendance/attendanceform",{

    })
} catch (error) {
    
}
}
module.exports={loadAttendanceForm}