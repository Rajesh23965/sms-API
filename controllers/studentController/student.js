const db = require("../../models");
const Student = db.students;
const Province = db.province;
const Class = db.classes;
const Section = db.sections;

const loadStudentForm = async (req, res) => {
  const studentId = req.query.studentId;
  try {
    const provinces = await Province.findAll();
    const classes = await Class.findAll();
    const sections = await Section.findAll();

    const error = req.session.error || "";
    const success = req.session.success || "";
    const oldInput = req.session.oldInput || {};
    const errorFields = req.session.errorFields || [];
    req.session.error = null;
    req.session.success = null;
    req.session.oldInput = null;
    req.session.errorFields = null;

    let student = null;
    if (studentId) {
      student = await Student.findByPk(studentId);
    }

    res.render("students/studentsForm", {
      studentId,
      error,
      success,
      oldInput,
      errorFields,
      provinces,
      classes,
      sections,
      student,
    });
  } catch (error) {
    console.error("Sequelize error:", error.message);
    res.status(500).send("Internal Server Error: " + error.message);
  }
};

const addOrUpdateStudent = async (req, res) => {
  let redirectURL;
  try {
    const studentData = req.body;
    const studentId = req.query.studentId;
    redirectURL = studentId
      ? `/students/student-form?studentId=${studentId}`
      : "/students/student-form";

    const requiredFields = [
      "first_name",
      "last_name",
      "gender",
      "dob",
      "phone",
      "email",
      "class_id",
      "section_id",
    ];

    const missingFields = requiredFields.filter((field) => !studentData[field]);
    if (missingFields.length) {
      req.session.error = "All fields are required.";
      req.session.oldInput = studentData;
      req.session.errorFields = missingFields;
      return res.redirect(redirectURL);
    }

    const emailExists = await Student.findOne({
      where: { email: studentData.email },
    });

    if (emailExists && (!studentId || emailExists.id !== parseInt(studentId))) {
      req.session.error = "Email already registered.";
      req.session.oldInput = studentData;
      req.session.errorFields = ["email"];
      return res.redirect(redirectURL);
    }

    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(studentData.phone)) {
      req.session.error = "Invalid phone number format.";
      req.session.oldInput = studentData;
      req.session.errorFields = ["phone"];
      return res.redirect(redirectURL);
    }

    let student;
    if (studentId) {
      student = await Student.findByPk(studentId);
      if (!student) {
        req.session.error = "Student not found.";
        return res.redirect(redirectURL);
      }

      await student.update({
        ...studentData,
        status: studentData.status || student.status,
      });
    } else {
      const admission_no = await generateAdmissionNo();

      student = await Student.create({
        ...studentData,
        admission_no,
        status: studentData.status || "active",
      });
    }

    req.session.success = studentId
      ? "Student updated successfully."
      : "Student added successfully.";
    return res.redirect("/students/student-list");
  } catch (error) {
    console.error("Error processing student:", error);
    req.session.error = "Server error. Please try again later.";
    req.session.oldInput = req.body;
    return res.redirect(redirectURL);
  }
};

const generateAdmissionNo = async () => {
  const lastStudent = await Student.findOne({ order: [["id", "DESC"]] });
  const lastId = lastStudent ? lastStudent.id + 1 : 1;
  const year = new Date().getFullYear().toString().slice(-2);
  return `SCH08${year}${String(lastId).padStart(3, "0")}`;
};

const loadStudentList = async (req, res) => {
  try {
    const studentlist = await Student.findAll();
    res.render("students/studentlist", { studentlist });
  } catch (error) {
    console.error("Error loading student list:", error);
    req.session.error = "Unable to load student list.";
    res.redirect("/students/student-list");
  }
};

const deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const studentData = await Student.findByPk(id);
    if (!studentData) {
      req.session.error = "Student record not found";
      return res.redirect("/students/student-list");
    }

    await studentData.destroy();
    req.session.success = "Student Record Deleted Successfully";
    return res.redirect("/students/student-list");
  } catch (error) {
    console.error("Error deleting class:", error);
    req.session.errorFields = ["first_name"];
    req.session.oldInput = req.body;
    req.session.error = "Internal server error";
    return res.redirect("/students/student-list");
  }
};

module.exports = {
  addOrUpdateStudent,
  loadStudentForm,
  loadStudentList,
  deleteStudent,
};
