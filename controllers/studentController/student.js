const { Op, where } = require("sequelize");
const db = require("../../models");
const fs = require('fs');
const path = require('path');
const Student = db.students;
const Province = db.province;
const Class = db.classes;
const Section = db.sections;
const StudentAcademicHistory = db.student_academic_histories

const loadStudentForm = async (req, res) => {
  const studentId = req.query.studentId;
  try {
    const provinces = await Province.findAll();
    const classes = await Class.findAll();
    const sections = await Section.findAll();
    
    // Set default academic years (just current year)
    const currentYear = new Date().getFullYear();
    const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;
    const academicYears = [defaultAcademicYear];

    const error = req.session.error || "";
    const success = req.session.success || "";
    const oldInput = req.session.oldInput || {};
    const errorFields = req.session.errorFields || [];
    req.session.error = null;
    req.session.success = null;
    req.session.oldInput = null;
    req.session.errorFields = null;

    let student = null;
    let currentAcademicYear = defaultAcademicYear;
    
    if (studentId) {
      student = await Student.findByPk(studentId, {
        include: [
          {
            model: StudentAcademicHistory,
            as: 'academicHistories',
            where: { is_current: true },
            required: false,
            include: [
              {
                model: Class,
                as: 'class',
                attributes: ['id', 'class_name', 'numeric_name']
              },
              {
                model: Section,
                as: 'section',
                attributes: ['id', 'section_name']
              }
            ]
          }
        ]
      });

      // Get academic year from database if exists
      if (student?.academicHistories?.[0]?.academic_year) {
        currentAcademicYear = student.academicHistories[0].academic_year;
        
        // Add database year to academicYears if it's different
        if (!academicYears.includes(currentAcademicYear)) {
          academicYears.unshift(currentAcademicYear); // Add to beginning
        }
      }
      
      // Format date for form input
      if (student && student.dob) {
        const dob = new Date(student.dob);
        const formattedDob = dob.toISOString().split('T')[0];
        student.dob = formattedDob;
      }
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
      academicYears,
      currentAcademicYear,
      defaultAcademicYear
    });
  } catch (error) {
    console.error("Sequelize error:", error.message);
    req.session.error = "Internal server error";
    res.redirect('/students/student-list');
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
      const academicYear = studentData.current_academic_year || 
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  
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
      // Handle image deletion
      if (studentData.delete_image === 'on') {
        // Delete the old image file from server
        if (student.image) {
          const imagePath = path.join(__dirname, '../../public/uploads/students', student.image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        studentData.image = null;
      }
      if (req.file) {
        // Delete old image if exists
        if (student.image) {
          const oldImagePath = path.join(__dirname, '../../public/uploads/students', student.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        studentData.image = req.file.filename;
      }


      await student.update({
        ...studentData,
        status: studentData.status || student.status,
      });

      let academicHistory = await StudentAcademicHistory.findOne({
        where: {
          student_id: student.id,
          academic_year: academicYear
        }
      });

      if (academicHistory) {
        await academicHistory.update({
          class_id: studentData.class_id,
          section_id: studentData.section_id,
          is_current: true
        });
      } else {
        // Mark previous current record as not current
        await StudentAcademicHistory.update(
          { is_current: false },
          { where: { student_id: student.id, is_current: true } }
        );

        // Create new academic history record
        await StudentAcademicHistory.create({
          student_id: student.id,
          admission_no: student.admission_no,
          academic_year: academicYear,
          class_id: studentData.class_id,
          section_id: studentData.section_id,
          status: 'promoted',
          is_current: true,
          promotion_date: new Date()
        });
      }



    } else {
      const admission_no = await generateAdmissionNo();
      studentData.image = req.file ? req.file.filename : null;

      student = await Student.create({
        ...studentData,
        admission_no,
        status: studentData.status || "active",
      });
      // Create initial academic history record
      await StudentAcademicHistory.create({
        student_id: student.id,
        academic_year: academicYear,
        class_id: studentData.class_id,
        section_id: studentData.section_id,
        status: 'promoted',
        is_current: true,
        promotion_date: new Date()
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    // Build the where clause for search
    const whereClause = {};
    if (searchQuery) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${searchQuery}%` } },
        { last_name: { [Op.like]: `%${searchQuery}%` } },
        { middle_name: { [Op.like]: `%${searchQuery}%` } },
        { admission_no: { [Op.like]: `%${searchQuery}%` } },
        { email: { [Op.like]: `%${searchQuery}%` } },
        { phone: { [Op.like]: `%${searchQuery}%` } }
      ];
    }

    const { count, rows: studentlist } = await Student.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: StudentAcademicHistory,
          as: 'academicHistories',
          where: { is_current: true },
          required: false,
          include: [
            {
              model: Class,
              as: 'class',
              attributes: ['class_name']
            },
            {
              model: Section,
              as: 'section',
              attributes: ['section_name']
            }
          ],
          required: false 
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);
    const startEntry = offset + 1;
    const endEntry = Math.min(offset + limit, count);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const previousPage = hasPreviousPage ? page - 1 : null;
    const paginationStart = Math.max(1, page - 2);
    const paginationEnd = Math.min(totalPages, page + 2);

    const success = req.session.success || "";
    const error = req.session.error || "";
    req.session.success = null;
    req.session.error = null;
    res.render("students/studentlist", {
      studentlist,
      searchQuery,
      pagination: {
        totalItems: count,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage,
        previousPage,
        paginationStart,
        paginationEnd,
        limit,
        startEntry,
        endEntry,
      },
      success,
      error,
    });

  } catch (error) {
    console.error("Error loading student list:", error);
    req.session.error = "Unable to load student list.";
    res.redirect("/students/student-list");
  }
};

//Count Total Student
const getTotalStudents = async (req, res) => {
  try {
    const count = await Student.count();
    res.json({ totalStudents: count });
  } catch (error) {
    console.error("Failed to count students:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
  // Delete academic history first
  await StudentAcademicHistory.destroy({
    where: { student_id: id }
  });
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
  getTotalStudents
};
