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
  if (percentage >= 40) return { grade: 'D', point: 1.6 };
  return { grade: 'N/A', point: 0.0 };
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
    const schoolInfo = await db.schoolinfo.findOne();
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
      academicYears,
      schoolInfo,
      title: "Result Management",
      header: "Result Setup",
      headerIcon: "fa-solid fa-square-poll-vertical",
      buttons: [
        { text: "Refresh", href: "/results/results", color: "red", icon: "fa-solid fa-rotate" },

      ]
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
    const schoolInfo = await db.schoolinfo.findOne();

    // First find the student's academic history for the specified year
    const academicHistory = await db.student_academic_histories.findOne({
      where: {
        admission_no: admissionNo,
        academic_year: academicYear,
        ...(classId && { class_id: classId }),
        ...(sectionId && { section_id: sectionId }),
      },
      include: [
        {
          model: db.students,
          as: 'student',
          attributes: ["id", "first_name", "middle_name", "last_name", "image", "fname", "dob"],
          where: { status: 'active' },
          required: true,
          include: [{
            model: db.schoolinfo,
            as: 'school',
            attributes: ['id', 'school_name', 'address', 'phone_number', 'email', 'logo']
          }]
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

    // Get all subjects for the class with their codes
    const classSubjects = await db.subjectCode.findAll({
      where: {
        class_id: academicHistory.class_id
      },
      include: [
        {
          model: db.subjects,
          as: 'subject',
          attributes: ['id', 'name', 'fullmarks', 'passmarks', 'practicalMarks']
        }
      ],
      raw: true,
      nest: true
    });

    const examResults = await db.examResults.findAll({
      where: {
        exam_id: examTypeId,
        student_id: academicHistory.student_id,
        academic_year: academicYear,
        class_id: academicHistory.class_id,
        section_id: academicHistory.section_id,
      },

      raw: true,
      nest: true
    });

    const resultMap = {};
    examResults.forEach(result => {
      resultMap[result.subject_code] = result;
    });


    const subjects = classSubjects.map(subjectItem => {
      const result = resultMap[subjectItem.code] || {};

      const marks = result.marks_obtained ?? 0;
      const practicalMar = result.practical_marks ?? 0;
      const totalMarksObtained = marks + practicalMar;

      const subject = subjectItem.subject;
      const fullmarks = subject.fullmarks || 100;
      const passmarks = subject.passmarks || 35;
      const practicalMarks = subject.practicalMarks || 0;
      const percentage = (totalMarksObtained / fullmarks) * 100;
      const { grade, point } = calculateGrade(percentage);

      const status = result.marks_obtained != null ? (totalMarksObtained >= passmarks ? "Pass" : "Fail") : "Absent";

      return {
        name: subject.name || 'Unknown Subject',
        code: subjectItem.code,
        marks,
        practicalMar,
        totalMarks: totalMarksObtained,
        fullMarks: fullmarks,
        passMarks: passmarks,
        practicalMarks,
        percentage: percentage.toFixed(2),
        grade,
        gradePoint: point,
        status
      };
    });

    const totalMarks = subjects.reduce((sum, subj) => sum + subj.totalMarks, 0);
    const totalFullMarks = subjects.reduce((sum, subj) => sum + subj.fullMarks, 0);
    const overallPercentage = (totalMarks / totalFullMarks * 100).toFixed(2);
    const cgpa = calculateCGPA(subjects);
    // const overallStatus = subjects.every(subj => subj.status === "Pass") ? "Pass" : "Fail";
    let overallStatus;

    if (subjects.every(subj => subj.status === "Pass")) {
      overallStatus = "Pass";
    } else if (subjects.some(subj => subj.status === "Fail")) {
      overallStatus = "Fail";
    } else if (subjects.some(subj => subj.status === "Not Appeared" || subj.status === "Absent")) {
      overallStatus = "Absent";
    } else {
      overallStatus = "Pending";
    }
    // Get exam details
    const exam = await db.exams.findOne({
      where: { id: examTypeId },
      include: [{
        model: db.terms,
        as: 'term',
        attributes: ['start_date', 'end_date']
      }]
    });
    const response = {
      school: schoolInfo ? {
        name: schoolInfo.school_name,
        address: schoolInfo.address,
        phone: schoolInfo.phone_number,
        email: schoolInfo.email,
        logo: schoolInfo.logo
      } : null,
      student: {
        id: academicHistory.student.id,
        admissionNo: academicHistory.admission_no,
        name: `${academicHistory.student.first_name} ${academicHistory.student.middle_name || ''} ${academicHistory.student.last_name || ''}`.trim(),
        class: academicHistory.class.class_name,
        section: academicHistory.section.section_name,
        image: academicHistory.student.image,
        fname: academicHistory.student.fname,
        dob: academicHistory.student.dob,
        academicYear,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        term: {
          start_date: exam.term?.start_date,
          end_date: exam.term?.end_date
        }
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
    console.log(subjects)
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
  const { admissionNo, classId, sectionId, examTypeId, academicYear } = req.query;

  if (!classId || !examTypeId || !academicYear) {
    return res.status(400).json({
      error: "Class, exam type and academic year are required"
    });
  }

  try {
    const schoolInfo = await db.schoolinfo.findOne();

    const exam = await db.exams.findOne({
      where: { id: examTypeId },
      include: [{
        model: db.terms,
        as: 'term',
        attributes: ['start_date', 'end_date']
      }]
    });
    const students = await db.student_academic_histories.findAll({
      where: {
        ...(admissionNo && { admission_no: admissionNo }),
        academic_year: academicYear,
        ...(classId && { class_id: classId }),
        ...(sectionId && { section_id: sectionId }),
      },
      include: [
        {
          model: db.students,
          as: 'student',
          attributes: ["id", "first_name", "middle_name", "last_name", "image", "fname", "dob"],
          where: { status: 'active' },
          required: true,
          include: [{
            model: db.schoolinfo,
            as: 'school',
            attributes: ['id', 'school_name', 'address', 'phone_number', 'email', 'logo']
          }]
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
      return res.status(404).json({ error: "No students found", details: { classId, sectionId, academicYear } });
    }
    const classSubjects = await db.subjectCode.findAll({
      where: {
        class_id: classId
      },
      include: [
        {
          model: db.subjects,
          as: 'subject',
          attributes: ['id', 'name', 'fullmarks', 'passmarks', 'practicalMarks']
        }
      ],
      raw: true,
      nest: true
    });

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
          attributes: ['id', 'name', 'fullmarks', 'passmarks', 'practicalMarks']
        }]
      }]
    });

    const results = students.map(student => {
      const studentResults = examResults.filter(er => er.student_id === student.student_id);
      const resultMap = {};
      studentResults.forEach(result => {
        resultMap[result.subject_code] = result;
      });
      const subjects = classSubjects.map(subjectItem => {
        const result = resultMap[subjectItem.code] || {};
        const subject = subjectItem.subject;

        const marks = result.marks_obtained ?? 0;
        const practicalMar = result.practical_marks ?? 0;
        const totalMarksObtained = marks + practicalMar;

        const fullmarks = subject.fullmarks || 100;
        const passmarks = subject.passmarks || 35;
        const practicalMarks = subject.practicalMarks || 0;
        const percentage = (totalMarksObtained / fullmarks) * 100;
        const { grade, point } = calculateGrade(percentage);

        const status = result.marks_obtained != null ? (totalMarksObtained >= passmarks ? "Pass" : "Fail") : "Absent";

        return {
          name: subject.name || 'Unknown Subject',
          code: subjectItem.code,
          marks,
          practicalMar,
          totalMarks: totalMarksObtained,
          fullMarks: fullmarks,
          passMarks: passmarks,
          practicalMarks,
          percentage: percentage.toFixed(2),
          grade,
          gradePoint: point,
          status
        };
      });


      const totalMarks = subjects.reduce((sum, subj) => sum + subj.totalMarks, 0);
      const totalFullMarks = subjects.reduce((sum, subj) => sum + subj.fullMarks, 0);
      const overallPercentage = totalFullMarks ? (totalMarks / totalFullMarks * 100).toFixed(2) : '0.00';
      const cgpa = totalMarks > 0 ? calculateCGPA(subjects) : '0.00';
      const overallStatus = totalMarks === 0 || subjects.some(subj => subj.status === "Fail") ? "Fail" : "Pass";

      return {
        school: schoolInfo ? {
          name: schoolInfo.school_name,
          address: schoolInfo.address,
          phone: schoolInfo.phone_number,
          email: schoolInfo.email,
          logo: schoolInfo.logo
        } : null,
        student: {
          id: student.student.id,
          admissionNo: student.admission_no,
          name: `${student.student.first_name} ${student.student.middle_name || ''} ${student.student.last_name || ''}`.trim(),
          class: student.class?.class_name || 'N/A',
          section: student.section?.section_name || 'N/A',
          image: student.student.image,
          fname: student.student.fname,
          dob: student.student.dob,
          academicYear,
        },
        exam: {
          id: exam.id,
          name: exam.name,
          term: {
            start_date: exam.term?.start_date,
            end_date: exam.term?.end_date
          }
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
    });

    const allTotals = results.map(r => r.summary.totalMarks);
    const processedResults = results.map(result => ({
      ...result,
      summary: {
        ...result.summary,
        percentile: calculatePercentile(result.summary.totalMarks, allTotals).toFixed(2)
      }
    }));

    const classInfo = await db.classes.findByPk(classId);
    const sectionInfo = sectionId ? await db.sections.findByPk(sectionId) : null;

    const response = {
      class: classInfo?.class_name || 'N/A',
      section: sectionInfo?.section_name || "All Sections",
      exam: {
        id: exam.id,
        name: exam.name,
        term: {
          start_date: exam.term?.start_date,
          end_date: exam.term?.end_date
        }
      },
      results: processedResults
    }
    console.log(response)
    res.json(response);
  } catch (error) {
    console.error("Error getting class results:", error);
    res.status(500).json({ error: "Error getting class results" });
  }
};


const getSectionsByClass = async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ error: "Missing classId in query parameters" });
    }

    const sectionData = await db.sections.findAll({
      where: { class_id },
      attributes: ['id', 'section_name'],
      order: [['section_name', 'ASC']],
    });



    res.status(200).json(sectionData);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ error: "Error fetching sections" });
  }
};



module.exports = {
  loadResult,
  searchStudentResult,
  getClassResults,
  getSectionsByClass
};