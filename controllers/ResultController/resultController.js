const { Op } = require("sequelize");
const db = require("../../models");
const StudentAcademicHistory = db.student_academic_histories


const calculateGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', point: 4.0 };
  if (percentage >= 80) return { grade: 'A', point: 3.6 };
  if (percentage >= 70) return { grade: 'B+', point: 3.2 };
  if (percentage >= 60) return { grade: 'B', point: 2.8 };
  if (percentage >= 50) return { grade: 'C+', point: 2.4 };
  if (percentage >= 40) return { grade: 'C', point: 2.0 };
  return { grade: 'D', point: 0.0 };
};

const calculateCGPA = (subjects) => {
  const totalPoints = subjects.reduce((sum, subj) => sum + subj.gradePoint, 0);
  return (totalPoints / subjects.length).toFixed(2);
};


const calculatePercentile = (studentMarks, allStudentsMarks) => {
  const sortedMarks = allStudentsMarks.map(s => s.totalMarks).sort((a, b) => b - a);
  const studentIndex = sortedMarks.indexOf(studentMarks);
  return ((1 - (studentIndex / sortedMarks.length)) * 100);
};

const loadResult = async (req, res) => {
  try {
    const classes = await db.classes.findAll();
    const examTypeList = await db.exams.findAll();

    const error = req.session.error || "";
    const success = req.session.success || "";

    req.session.error = null;
    req.session.success = null;
    const currentAcademicHistories = await StudentAcademicHistory.findAll({
      where: { is_current: true },
      attributes: ['academic_year'],
      group: ['academic_year']
    });

    const academicYears = currentAcademicHistories.map(item => item.academic_year);

    res.render("results/result", {
      classes,
      examTypeList,
      error,
      success,
      academicYears
    });
  } catch (error) {
    console.error("Error loading result page:", error);
    req.session.error = "Error loading result page";
    res.redirect("/");
  }
};
const searchStudentResult = async (req, res) => {
  const { admissionNo, examTypeId, academicYear, classId, sectionId } = req.query;

  if (!admissionNo || !examTypeId || !academicYear) {
    return res.status(400).json({ message: "Admission number, exam type ID and academic year are required." });
  }

  try {

    // First find the student's academic history for the specified year
    const academicHistory = await db.student_academic_histories.findOne({
      where: {
        admission_no: admissionNo,
        academic_year: academicYear,
        ...(classId && { class_id: classId }),
        ...(sectionId && { section_id: sectionId })
      },
      include: [
        {
          model: db.students,
          as: 'student',
          where: { status: 'active' },
          required: true
        },
        {
          model: db.classes,
          as: "class",
          attributes: ["id", "class_name"]
        },
        {
          model: db.sections,
          as: "section",
          attributes: ["id", "section_name"]
        }
      ]
    });

    if (!academicHistory) {

      return res.status(404).json({
        error: "Student not found with the specified criteria",
        details: { admissionNo, academicYear, classId, sectionId }
      });
    }



    // Get exam results for this student
    const examResults = await db.examResults.findAll({
      where: {
        exam_id: examTypeId,
        student_id: academicHistory.student_id,
        academic_year: academicYear,
        class_id: academicHistory.class_id,
        section_id: academicHistory.section_id
      },
      include: [{
        model: db.subjectCode,
        as: 'subjectCodeRef',
        include: [
          {
            model: db.subjects,
            as: 'subject',
            attributes: ['id', 'name', "fullmarks", "passmarks"]
          }
        ]
      }],
      raw: true, // Get raw data to inspect
      nest: true // Keep nested structure
    });


    if (!examResults.length) {
      return res.status(404).json({
        error: "No results found for this student in the specified exam",
        details: {
          admissionNo,
          examTypeId,
          academicYear,
          classId: academicHistory.class_id,
          sectionId: academicHistory.section_id
        }
      });
    }


    // Process results
    const subjects = examResults.map(result => {
      // Use marks_obtained instead of marks
      const marks = result.marks_obtained;
      const subjectClass = result.subjectCodeRef?.subject;
      const fullmarks = subjectClass?.fullmarks || 100;
      const passmarks = subjectClass?.passmarks || 40;
      const percentage = (marks / fullmarks) * 100;
      const { grade, point } = calculateGrade(percentage);
      const status = percentage >= passmarks ? "Pass" : "Fail";

      return {
        name: subjectClass?.name || 'Unknown Subject',
        code: result.subject_code,
        marks: marks,
        fullMarks: fullmarks,
        passMarks: passmarks,
        percentage: percentage.toFixed(2),
        grade,
        gradePoint: point,
        status
      };
    });

    const totalMarks = subjects.reduce((sum, subj) => sum + subj.marks, 0);
    const totalFullMarks = subjects.reduce((sum, subj) => sum + subj.fullMarks, 0);
    const overallPercentage = (totalMarks / totalFullMarks * 100).toFixed(2);
    const cgpa = calculateCGPA(subjects);
    const overallStatus = subjects.every(subj => subj.status === "Pass") ? "Pass" : "Fail";

    // Get exam details
    const exam = await db.exams.findByPk(examTypeId);

    const response = {
      student: {
        id: academicHistory.student.id,
        admissionNo: academicHistory.admission_no,
        name: `${academicHistory.student.first_name} ${academicHistory.student.middle_name || ''} ${academicHistory.student.last_name || ''}`.trim(),
        class: academicHistory.class.class_name,
        section: academicHistory.section.section_name,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        date: exam.start_date
      },
      subjects,
      summary: {
        totalMarks,
        totalFullMarks,
        overallPercentage,
        cgpa,
        overallStatus
      }
    };


    res.json(response);
  } catch (error) {
    console.error("Error fetching student result:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack
    });
  }
};


const getClassResults = async (req, res) => {
  const { classId, sectionId, examTypeId, academicYear } = req.query;

  if (!classId || !examTypeId || !academicYear) {
    return res.status(400).json({
      error: "Class, exam type and academic year are required"
    });
  }

  try {
    // Get all students in the class/section for the academic year
    const students = await db.student_academic_histories.findAll({
      where: {
        academic_year: academicYear,
        class_id: classId,
        ...(sectionId && { section_id: sectionId })
      },
      include: [
        {
          model: db.students,
          as: 'student',
          where: { status: 'active' },
          attributes: ["first_name", "middle_name", "last_name"],
          required: true
        },
        {
          model: db.classes,
          as: "class",
          attributes: ["id", "class_name"]
        },
        {
          model: db.sections,
          as: "section",
          attributes: ["id", "section_name"]
        }
      ]
    });

    if (!students.length) {
      return res.status(404).json({
        error: "No students found in the specified class/section",
        details: { classId, sectionId, academicYear }
      });
    }

    // Get exam results for all students
    const examResults = await db.examResults.findAll({
      where: {
        exam_id: examTypeId,
        student_id: { [Op.in]: students.map(s => s.student_id) },
        academic_year: academicYear,
        class_id: classId,
        ...(sectionId && { section_id: sectionId })
      },
      include: [{
        model: db.subjectCode,
        as: 'subjectCodeRef',
        include: [{
          model: db.subjects,
          as: 'subject',
          attributes: ['name', "fullmarks", "passmarks"]
        }]
      }]
    });

    if (!examResults.length) {
      return res.status(404).json({
        error: "No exam results found for the specified criteria",
        details: { classId, sectionId, examTypeId, academicYear }
      });
    }

    // Process results for each student
    const results = students.map(student => {
      const studentResults = examResults.filter(er => er.student_id === student.student_id);
    
      const subjects = studentResults.map(result => {
        const subjectClass = result.subjectCodeRef?.subject;
        const fullmarks = subjectClass?.fullmarks || 0;
        const passmarks = subjectClass?.passmarks || 0;
        const obtainedMarks = result.marks_obtained || 0;
    
        const percentage = fullmarks ? (obtainedMarks / fullmarks) * 100 : 0;
        const { grade, point } = calculateGrade(percentage);
        const status = obtainedMarks >= passmarks ? "Pass" : "Fail";
    
        return {
          name: result.subjectCodeRef?.subject?.name || 'Unknown Subject',
          code: result.subject_code,
          marks: obtainedMarks,
          fullMarks: fullmarks,
          passMarks: passmarks,
          percentage: percentage.toFixed(2),
          grade,
          gradePoint: point,
          status
        };
      });
    
      const totalMarks = subjects.reduce((sum, subj) => sum + subj.marks, 0);
      const totalFullMarks = subjects.reduce((sum, subj) => sum + subj.fullMarks, 0);
      const overallPercentage = totalFullMarks ? (totalMarks / totalFullMarks * 100).toFixed(2) : '0.00';
    
      const cgpa = totalMarks > 0 ? calculateCGPA(subjects) : '0.00';
    
      const overallStatus = totalMarks === 0 || subjects.some(subj => subj.status === "Fail") ? "Fail" : "Pass";
    
      return {
        student: {
          id: student.id,
          admissionNo: student.admission_no,
          name: `${student.student.first_name} ${student.student.middle_name || ''} ${student.student.last_name || ''}`.trim(),
          class: student.class.class_name,
          section: student.section.section_name,
        },
        subjects,
        summary: {
          totalMarks,
          overallPercentage,
          cgpa,
          overallStatus
        }
      };
    });
    

    // Calculate percentile for each student
    const allTotals = results.map(r => r.summary.totalMarks);
    const processedResults = results.map(result => ({
      ...result,
      summary: {
        ...result.summary,
        percentile: calculatePercentile(result.summary.totalMarks, allTotals).toFixed(2)
      }
    }));

    // Get exam details
    const exam = await db.exams.findByPk(examTypeId);
    const classInfo = await db.classes.findByPk(classId);
    const sectionInfo = sectionId ? await db.sections.findByPk(sectionId) : null;

    res.json({
      class: classInfo.class_name,
      section: sectionInfo?.section_name || "All Sections",
      exam: {
        id: exam.id,
        name: exam.name,
        date: exam.start_date
      },
      results: processedResults
    });
  } catch (error) {
    console.error("Error getting class results:", error);
    res.status(500).json({ error: "Error getting class results" });
  }
};




module.exports = {
  loadResult,
  searchStudentResult,
  getClassResults
};