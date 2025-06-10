//index.js
const dbConfig = require("../config/db.js");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
});
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.classes = require("./classModel/classes.js")(sequelize, DataTypes);
db.sections = require("./classModel/sections.js")(sequelize, DataTypes);
db.teachers = require("./userManage/teacher.js")(sequelize, DataTypes);
db.teacherSchedule = require("./userManage/teacher_schedule.js")(sequelize, DataTypes);
db.students = require("./userManage/student.js")(sequelize, DataTypes);
db.subjects = require("./classModel/subject.js")(sequelize, DataTypes);
db.studentSubjects = require("./classModel/student_subject.js")(
  sequelize,
  DataTypes
);
db.exams = require("./examManage/exams.js")(sequelize, DataTypes);
db.examResults = require("./examManage/exam_results.js")(sequelize, DataTypes);
db.attendance = require("./attendanceManage/attendance.js")(
  sequelize,
  DataTypes
);
db.fees = require("./accountManage/fees.js")(sequelize, DataTypes);
db.payments = require("./accountManage/payment.js")(sequelize, DataTypes);
db.province = require("./location/provincemodels.js")(sequelize, DataTypes);
db.district = require("./location/districtmodels.js")(sequelize, DataTypes);
db.vdc = require("./location/vdcmodels.js")(sequelize, DataTypes);

db.subjectCode = require("./classModel/subjectCode")(sequelize, DataTypes);
db.subjectClass = require("./classModel/subjectClass")(sequelize, DataTypes);
db.subjectTeacher = require("./classModel/subjectTeacher")(sequelize, DataTypes);
db.student_academic_histories = require("./examManage/studentAcademicYear.js")(sequelize, DataTypes);
db.terms = require("./examManage/terms.js")(sequelize, DataTypes);
db.schoolinfo = require("./SchoolInfo/schoolModel.js")(sequelize, DataTypes);
db.attendance = require("./attendanceManage/attendance.js")(sequelize, DataTypes);
db.attendance_summary = require("./attendanceManage/attendance_summary.js")(sequelize, DataTypes);
db.holidays_leaves = require("./attendanceManage/holidays_leaves.js")(sequelize, DataTypes);
db.admins = require("./Admin/admins.js")(sequelize, DataTypes);
db.role = require("./Role/rolemodel.js")(sequelize, DataTypes);
db.home_layout = require("./Layout/home_layout.js")(sequelize, DataTypes);
db.home_layout_url=require("./Layout/home_layout_url.js")(sequelize,DataTypes);
db.home_layout_roles=require("./Layout/home_layout_role.js")(sequelize,DataTypes);
// Setup associations
require("./associations.js")(db);

module.exports = db;
