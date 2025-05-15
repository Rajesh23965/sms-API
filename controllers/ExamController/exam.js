const { Op, where } = require("sequelize");
const validator = require("validator");
const db = require("../../models");
const ExamTypeModel = db.exams;
const ExamResultModel = db.examResults;
const SubjectClass = db.subjectClass;
const SubjectCode = db.subjectCode;
const StudentRec = db.students
const ClassList = db.classes;
const SectionList = db.sections;
const SubjectList = db.subjects
const Terms = db.terms
const StudentAcademicHistory = db.student_academic_histories



//exam type functionality
const loadExamTypeForm = async (req, res) => {
  try {
    // Clear session messages
    const error = req.session.error || "";
    const success = req.session.success || "";
    const oldInput = req.session.oldInput || {};
    const errorFields = req.session.errorFields || [];

    req.session.error = null;
    req.session.success = null;
    req.session.oldInput = null;
    req.session.errorFields = null;

    //Fetch Current academic Year from student_academic_histories table 
    const currentAcademicHistories = await StudentAcademicHistory.findAll({
      where: { is_current: true },
      attributes: ['academic_year'],
      group: ['academic_year']
    });

    const academicYears = currentAcademicHistories.map(item => item.academic_year);


    const rawTermId = req.query.termId || "";
    const termId = validator.escape(rawTermId.trim());


    // Fetch all terms with their exams
    const terms = await Terms.findAll({
      order: [['start_date', 'DESC']],
      include: [{
        model: ExamTypeModel,
        as: 'exams',
        attributes: ['id', 'name', 'exam_type', 'max_marks', 'weightage']
      }]
    });

    let currentTerm = null;
    let termDetails = null;

    if (termId) {
      termDetails = await Terms.findByPk(termId, {
        include: [{
          model: ExamTypeModel,
          as: 'exams'
        }]
      });

      if (!termDetails) {
        req.session.error = "Invalid Term ID";
        return res.redirect("/exams/exam-form-type");
      }
    }

    // Get current term if exists
    currentTerm = await Terms.findOne({
      where: { is_current: true },
      include: [{
        model: ExamTypeModel,
        as: 'exams'
      }]
    });

    res.render("exam/examTypeform", {
      errorFields,
      oldInput,
      success,
      error,
      terms,
      termDetails,
      currentTerm,
      academicYears,
      examTypes: ['weekly', 'monthly', 'terminal', 'final']
    });

  } catch (error) {
    console.error("Error loading exam type form:", error);
    res.render("exam/examTypeform", {
      errorFields: [],
      oldInput: {},
      success: "",
      error: "Failed to load data. Please try again later.",
      terms: [],
      termDetails: null,
      currentTerm: null,
      academicYears: [],
      examTypes: []
    });
  }
};

const saveTerm = async (req, res) => {
  const termData = req.body;
  const redirectURL = "/exams/exam-form-type";
  const rawTermId = req.query.termId || "";
  const termId = validator.escape(rawTermId.trim());

  try {
    // Validate required fields
    const requiredFields = ["name", "academic_year", "start_date", "end_date"];
    const missingFields = requiredFields.filter(field => !termData[field]);

    if (missingFields.length) {
      req.session.error = "All fields are required.";
      req.session.oldInput = termData;
      req.session.errorFields = missingFields;
      return res.redirect(
        redirectURL + (termId ? `?termId=${termId}` : "")
      );
    }



    const whereCondition = {
      name: termData.name,
      academic_year: termData.academic_year
    };

    if (termId) {
      whereCondition.id = { [Op.ne]: termId };
    }

    const existingTerm = await Terms.findOne({ where: whereCondition });

    if (existingTerm) {
      req.session.error = "Term with this name already exists for the academic year";
      req.session.oldInput = termData;
      req.session.errorFields = ["name"];
      return res.redirect(
        redirectURL + (termId ? `?termId=${termId}` : "")
      );
    }

    // Handle current term setting
    if (termData.is_current === "on") {
      // Reset current term if setting new one
      await Terms.update(
        { is_current: false },
        { where: { is_current: true } }
      );
    }

    if (termId) {
      // Update existing term
      const updated = await Terms.update(
        {
          name: termData.name,
          academic_year: termData.academic_year,
          start_date: termData.start_date,
          end_date: termData.end_date,
          is_current: termData.is_current === "on"
        },
        { where: { id: termId } }
      );

      if (updated[0] === 0) {
        req.session.error = "Update failed. Term not found.";
      } else {
        req.session.success = "Term updated successfully!";
      }
    } else {
      // Create new term
      await Terms.create({
        name: termData.name,
        academic_year: termData.academic_year,
        start_date: termData.start_date,
        end_date: termData.end_date,
        is_current: termData.is_current === "on"
      });

      req.session.success = "Term created successfully!";
    }

    return res.redirect(redirectURL);
  } catch (error) {
    console.error("Error saving term:", error);
    req.session.error = "Server error. Please try again later.";
    req.session.oldInput = req.body;
    return res.redirect(redirectURL);
  }
};

// Create exam for a term
const createExam = async (req, res) => {
  const examData = req.body;
  const redirectURL = "/exams/exam-form-type";

  try {
    // Validate required fields
    const requiredFields = ["name", "exam_type", "term_id"];
    const missingFields = requiredFields.filter(field => !examData[field]);

    if (missingFields.length) {
      req.session.error = "Exam name, type and term are required";
      return res.redirect(redirectURL);
    }


    // Create new exam
    await ExamTypeModel.create({
      name: examData.name,
      description: examData.description || null,
      term_id: examData.term_id,
      exam_type: examData.exam_type,
      max_marks: examData.max_marks || 100,
      weightage: examData.weightage || 1
    });

    req.session.success = "Exam created successfully!";
    return res.redirect(redirectURL);

  } catch (error) {
    console.error("Error creating exam:", error);
    req.session.error = "Failed to create exam. Please try again.";
    return res.redirect(redirectURL);
  }
};

// Delete term
const deleteTerm = async (req, res) => {
  const termId = req.query.termId || "";
  const redirectURL = "/exams/exam-form-type";

  if (!termId) {
    req.session.error = "Invalid term ID";
    return res.redirect(redirectURL);
  }

  try {
    // Check if term has exams
    const examsCount = await ExamTypeModel.count({ where: { term_id: termId } });

    if (examsCount > 0) {
      // First delete all exams associated with this term
      await ExamTypeModel.destroy({ where: { term_id: termId } });

      // Now delete the term
      const deleted = await Terms.destroy({ where: { id: termId } });

      if (deleted) {
        req.session.success = "Term and associated exams deleted successfully";
      } else {
        req.session.error = "Term not found";
      }
    } else {
      // No exams, just delete the term
      const deleted = await Terms.destroy({ where: { id: termId } });

      if (deleted) {
        req.session.success = "Term deleted successfully";
      } else {
        req.session.error = "Term not found";
      }
    }

    return res.redirect(redirectURL);
  } catch (error) {
    console.error("Error deleting term:", error);
    req.session.error = "Server error while deleting term";
    return res.redirect(redirectURL);
  }
};

//Student Marks Assign
const loadExamForm = async (req, res) => {
  try {
    // Fetch both exam types and classes in parallel for better performance

    const [examTypeList, classes] = await Promise.all([
      ExamTypeModel.findAll({
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'description']
      }),
      ClassList.findAll({
        order: [['numeric_name', 'ASC']],
        attributes: ['id', 'class_name']
      })
    ]);

    //Fetch Current academic Year from student_academic_histories table 
    const currentAcademicHistories = await StudentAcademicHistory.findAll({
      where: { is_current: true },
      attributes: ['academic_year'],
      group: ['academic_year']
    });

    const academicYears = currentAcademicHistories.map(item => item.academic_year);

    // Get session messages and clear them
    const error = req.session.error || "";
    const success = req.session.success || "";
    const examTypeId = req.session.examTypeId || "";

    req.session.error = null;
    req.session.success = null;
    req.session.examTypeId = null;

    res.render("exam/examform", {
      examTypeList,
      academicYears,
      classes,
      error,
      success,
      examTypeId,
    });
  } catch (error) {
    console.error("Error loading exam form:", error);

    // Provide a fallback empty array if exam types can't be loaded
    res.render("exam/examform", {
      examTypeList: [],
      classes: [],
      academicYears: [],
      error: "Failed to load exam data. Please try again later.",
      success: "",
      examTypeId: ""
    });
  }
};



const searchresult = async (req, res) => {
  try {
    const searchedText = (req.query.q || "").trim();
    const examTypeId = req.query.examTypeId;
    const academicYearParam = req.query.academicYear;

    if (!searchedText) return res.json({});

    // Build base query conditions
    const whereConditions = {
      admission_no: searchedText
    };

    // If not provided, search for current academic year only
    if (academicYearParam) {
      whereConditions.academic_year = academicYearParam;
    } else {
      whereConditions.is_current = 1;
    }

    // Get academic record for the student
    const studentHistory = await db.student_academic_histories.findOne({
      where: whereConditions,
      include: [
        {
          model: db.students,
          as: 'student',
          where: { status: 'active' }
        },
        {
          model: ClassList,
          as: "class",
          attributes: ["id", "class_name", "numeric_name"],
        },
        {
          model: SectionList,
          as: "section",
          attributes: ["id", "section_name"],
        },
      ]
    });

    if (!studentHistory) {
      return res.status(404).json({
        message: academicYearParam
          ? "Student record not found for the selected academic year"
          : "Active student record not found"
      });
    }

    const academicYear = studentHistory.academic_year;
    const classId = studentHistory.class_id;
    const sectionId = studentHistory.section_id;
    const studentId = studentHistory.student_id;

    // Get subject classes
    const subjectClasses = await SubjectClass.findAll({
      where: {
        class_id: classId,
        section_id: sectionId,
      },
      include: [
        {
          model: SubjectList,
          as: "subject",
          attributes: ["id", "name"],
        }
      ],
    });

    // Get subject codes
    const subjectCodes = await SubjectCode.findAll({
      where: {
        class_id: classId
      },
      attributes: ['subject_id', 'code']
    });

    // Get existing exam results if examTypeId is provided
    let existingResults = [];
    if (examTypeId) {
      existingResults = await ExamResultModel.findAll({
        where: {
          student_id: studentId,
          exam_id: examTypeId,
          academic_year: academicYear
        }
      });
    }

    // Create maps
    const codeMap = {};
    subjectCodes.forEach(code => {
      codeMap[code.subject_id] = code.code;
    });

    // const marksMap = {};
    // existingResults.forEach(result => {
    //   marksMap[result.subject_code] = result.marks;
    // });
    // const marksMap = {};
    // existingResults.forEach(result => {
    //   marksMap[result.subject_code] = result.marks_obtained;
    // });
    const marksMap = {};
    existingResults.forEach(result => {
      marksMap[result.subject_code] = {
        marks_obtained: result.marks_obtained,
        practical_marks: result.practical_marks
      };
    });

    // Format the response
    const response = {
      student: studentHistory.student,
      academicYear,
      class: studentHistory.class,
      section: studentHistory.section,
      subjects: subjectClasses.map(sc => ({
        id: sc.subject.id,
        name: sc.subject.name,
        code: codeMap[sc.subject_id] || '',
        passmarks: sc.passmarks,
        fullmarks: sc.fullmarks,
        practical_fullmarks: sc.practical_fullmarks || null, // Use null instead of 0
        practicalPassmarks: sc.practicalPassmarks,
        marks: {
          marks_obtained: marksMap[codeMap[sc.subject_id]]?.marks_obtained || null,
          practical_marks: marksMap[codeMap[sc.subject_id]]?.practical_marks || null
        }
      }))
    };

    res.json(response);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Server error while searching.",
      message: error.message || "An unknown error occurred.",
    });
  }
};

const addstudentsMarks = async (req, res) => {
  try {
    const { admissionNumber, examType, academicYear, ...subjectMarks } = req.body;

    if (!admissionNumber || !examType) {
      req.session.error = "Registration number & Exam type are required.";
      return res.redirect("/exams/exam-form");
    }

    // Build the where clause dynamically
    const whereClause = {
      admission_no: admissionNumber
    };

    // Only add is_current if academicYear is not provided
    if (!academicYear) {
      whereClause.is_current = true;
    } else {
      whereClause.academic_year = academicYear;
    }

    // Find student's academic record
    const studentHistory = await db.student_academic_histories.findOne({
      where: whereClause,
      include: [
        {
          model: db.students,
          as: 'student',
          where: { status: 'active' }
        },
        {
          model: db.classes,
          as: "class",
          attributes: ["id", "class_name"],
        },
        {
          model: db.sections,
          as: "section",
          attributes: ["id", "section_name"],
        },
      ]
    });

    if (!studentHistory) {
      req.session.error = academicYear
        ? "Student record not found for the selected academic year"
        : "Active student record not found";
      return res.redirect("/exams/exam-form");
    }

    const academicYearToUse = academicYear || studentHistory.academic_year;
    const classId = studentHistory.class_id;
    const sectionId = studentHistory.section_id;
    const studentId = studentHistory.student_id;

    // Get all subject classes with subject IDs
    const subjectClasses = await db.subjectClass.findAll({
      where: {
        class_id: classId,
        section_id: sectionId,
      },
      include: [
        {
          model: db.subjects,
          as: "subject",
          attributes: ["id", "name"],
        },
        {
          model: db.subjectCode,
          as: "subjectCode",
          attributes: ["code"],
          required: false,
        },
      ],
    });

    // Create maps for quick lookup
    const subjectCodeToIdMap = {};
    const subjectFullMarks = {};
    const subjectPracticalMarks = {};

    subjectClasses.forEach(sc => {
      const code = sc.subjectCode?.code;
      if (code) {
        subjectCodeToIdMap[code] = sc.subject.id;
        subjectFullMarks[code] = sc.fullmarks;
        subjectPracticalMarks[code] = sc.practical_marks || 0;
      }
    });

    // Get existing exam results
    const existingResults = await db.examResults.findAll({
      where: {
        student_id: studentId,
        exam_id: examType,
        academic_year: academicYearToUse
      },
    });

    const existingResultsMap = {};
    existingResults.forEach(result => {
      existingResultsMap[result.subject_code] = result;
    });

    const marksToSave = [];
    const marksToUpdate = [];
    const errors = [];
    const subjectCodes = [];

    // Process each subject mark
    for (const [fieldName, marks] of Object.entries(subjectMarks)) {
      if (!marks && marks !== "0") continue;

      if (fieldName.endsWith('_theory')) {
        const subjectCode = fieldName.replace('_theory', '');

        // Check for duplicate subject codes
        if (subjectCodes.includes(subjectCode)) {
          errors.push(`Duplicate entry for subject ${subjectCode}`);
          continue;
        }
        subjectCodes.push(subjectCode);

        // Validate subject exists
        if (!subjectCodeToIdMap[subjectCode]) {
          errors.push(`Invalid subject code: ${subjectCode}`);
          continue;
        }

        const theoryMarks = parseFloat(marks);
        const fullMarks = subjectFullMarks[subjectCode];
        const practicalFullMarks = subjectPracticalMarks[subjectCode] || 0;

        // Validate theory marks
        if (isNaN(theoryMarks)) {
          errors.push(`Theory marks for ${subjectCode} must be a number`);
          continue;
        }
        if (theoryMarks > fullMarks) {
          errors.push(`Theory marks for ${subjectCode} cannot exceed ${fullMarks}`);
          continue;
        }
        if (theoryMarks < 0) {
          errors.push(`Theory marks for ${subjectCode} cannot be negative`);
          continue;
        }

        const practicalMarksField = `${subjectCode}_practical`;
        let practicalMarks = null; // Initialize as null

        // Only process practical marks if they were submitted and the subject has practical component
        if (req.body[practicalMarksField] !== undefined && req.body[practicalMarksField] !== "") {
          practicalMarks = parseFloat(req.body[practicalMarksField]);

          // Validate practical marks if they exist
          if (isNaN(practicalMarks)) {
            errors.push(`Practical marks for ${subjectCode} must be a number`);
            continue;
          }
          if (practicalMarks < 0) {
            errors.push(`Practical marks for ${subjectCode} cannot be negative`);
            continue;
          }
          // Only validate against max marks if subject has practical component
          if (subjectPracticalMarks[subjectCode] > 0 && practicalMarks > subjectPracticalMarks[subjectCode]) {
            errors.push(`Practical marks for ${subjectCode} cannot exceed ${subjectPracticalMarks[subjectCode]}`);
            continue;
          }
        }


        // Calculate total marks
        const totalMarks = theoryMarks + practicalMarks;

        // Determine grade and pass status (implement your grading logic here)
        const { grade, isPassed } = calculateGradeAndStatus(totalMarks, fullMarks + practicalFullMarks);

        // Prepare for save/update
        const markData = {
          student_id: studentId,
          exam_id: examType,
          subject_code: subjectCode,
          subject_id: subjectCodeToIdMap[subjectCode],
          marks_obtained: theoryMarks,
          practical_marks: practicalMarks,
          grade: grade,
          is_passed: isPassed,
          academic_year: academicYearToUse,
          class_id: classId,
          section_id: sectionId
        };

        if (existingResultsMap[subjectCode]) {
          marksToUpdate.push({
            ...markData,
            id: existingResultsMap[subjectCode].id,
          });
        } else {
          marksToSave.push(markData);
        }
      }
    }

    if (errors.length > 0) {
      req.session.error = errors.join('<br>');
      return res.redirect("/exams/exam-form");
    }

    // Use transaction for atomic operations
    await db.sequelize.transaction(async (transaction) => {
      if (marksToSave.length > 0) {
        await db.examResults.bulkCreate(marksToSave, { transaction });
      }

      for (const mark of marksToUpdate) {
        const { id, ...dataToUpdate } = mark;
        await db.examResults.update(
          dataToUpdate,
          { where: { id }, transaction }
        );
      }
    });

    req.session.success = "Marks saved successfully";
    req.session.examTypeId = examType;
    return res.redirect("/exams/exam-form");

  } catch (error) {
    console.error("Error saving student marks:", error);
    req.session.error = "Server error while saving marks.";
    return res.redirect("/exams/exam-form");
  }
};

// Helper function for grade calculation (customize according to your grading system)
function calculateGradeAndStatus(totalMarks, maxMarks) {
  const percentage = (totalMarks / maxMarks) * 100;

  let grade = 'F';
  let isPassed = false;

  if (percentage >= 90) {
    grade = 'A+';
    isPassed = true;
  } else if (percentage >= 80) {
    grade = 'A';
    isPassed = true;
  } else if (percentage >= 70) {
    grade = 'B+';
    isPassed = true;
  } else if (percentage >= 60) {
    grade = 'B';
    isPassed = true;
  } else if (percentage >= 50) {
    grade = 'C+';
    isPassed = true;
  } else if (percentage >= 40) {
    grade = 'C';
    isPassed = true;
  } else if (percentage >= 30) {
    grade = 'D';
    isPassed = true;
  }

  return { grade, isPassed };
}

// Get bulk marks data
const getBulkMarksData = async (req, res) => {
  try {
    const { class_id, section_id, exam_id, academic_year } = req.query;

    // Validate inputs
    if (!class_id || !exam_id) {
      return res.status(400).json({ error: "Missing required parameters (class_id and exam_id are required)" });
    }

    // Build where condition for academic year
    const academicWhere = academic_year
      ? { academic_year }
      : { is_current: true };

    // Build where condition for class/section
    const classSectionWhere = section_id
      ? { class_id, section_id }
      : { class_id };

    // Get all students in the class/section for the academic year
    const studentHistories = await db.student_academic_histories.findAll({
      where: {
        ...classSectionWhere,
        ...academicWhere
      },
      include: [
        {
          model: db.students,
          as: 'student',
          where: { status: 'active' },
          attributes: ['id', 'admission_no', 'first_name', 'middle_name', 'last_name']
        }
      ],
      order: [['student', 'first_name', 'ASC']]
    });

    if (studentHistories.length === 0) {
      return res.status(404).json({
        error: academic_year
          ? `No students found in ${section_id ? 'this section' : 'this class'} for ${academic_year}`
          : `No active students found in ${section_id ? 'this section' : 'this class'}`
      });
    }

    // Get the academic year being used (either provided or current)
    const effectiveAcademicYear = academic_year || studentHistories[0].academic_year;

    // Get all subjects for the class/section
    const subjectWhere = section_id
      ? { class_id, section_id }
      : { class_id };

    const subjectClasses = await SubjectClass.findAll({
      where: subjectWhere,
      include: [
        {
          model: SubjectList,
          as: "subject",
          attributes: ["id", "name"]
        },
        {
          model: SubjectCode,
          as: "subjectCode",
          attributes: ["code"],
          where: { class_id }
        }
      ]
    });

    if (subjectClasses.length === 0) {
      return res.status(404).json({
        error: `No subjects found for ${section_id ? 'this class/section' : 'this class'}`
      });
    }

    // Format subjects data
    // Format subjects data with no duplicates when section_id is not provided
    let subjects;

    if (section_id) {
      // If section is provided, return all subjects as is
      subjects = subjectClasses.map(sc => ({
        id: sc.subject.id,
        name: sc.subject.name,
        code: sc.subjectCode.code,
        fullmarks: sc.fullmarks,
        passmarks: sc.passmarks
      }));
    } else {
      // If only class_id is provided, ensure unique subjects by subject.id
      const uniqueSubjectMap = new Map();
      subjectClasses.forEach(sc => {
        if (!uniqueSubjectMap.has(sc.subject.id)) {
          uniqueSubjectMap.set(sc.subject.id, {
            id: sc.subject.id,
            name: sc.subject.name,
            code: sc.subjectCode.code,
            fullmarks: sc.fullmarks,
            passmarks: sc.passmarks
          });
        }
      });
      subjects = Array.from(uniqueSubjectMap.values());
    }

    // Get existing marks for these students and exam
    const existingMarks = await ExamResultModel.findAll({
      where: {
        exam_id,
        academic_year: effectiveAcademicYear,
        student_id: studentHistories.map(s => s.student_id)
      }
    });

    // Create a map of student_id -> { subject_code -> marks }
    const marksMap = {};
    existingMarks.forEach(mark => {
      if (!marksMap[mark.student_id]) {
        marksMap[mark.student_id] = {};
      }
      marksMap[mark.student_id][mark.subject_code] = mark.marks_obtained;
    });

    // Format response with students and their marks
    const students = studentHistories.map(history => ({
      id: history.student_id,
      admission_no: history.student.admission_no,
      name: `${history.student.first_name} ${history.student.middle_name || ''} ${history.student.last_name}`.trim(),
      marks: marksMap[history.student_id] || {}
    }));

    res.json({
      academicYear: effectiveAcademicYear,
      students,
      subjects,
      message: section_id
        ? `Showing students from selected section`
        : `Showing all students from class (no section selected)`
    });
  } catch (error) {
    console.error("Error getting bulk marks data:", error);
    res.status(500).json({
      error: "Error getting bulk marks data",
      message: error.message
    });
  }
};
// Save bulk marks
const saveBulkMarks = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, academic_year, marks_data } = req.body;

    if (!exam_id || !class_id || !section_id || !academic_year || !marks_data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(marks_data)) {
      return res.status(400).json({ error: "Invalid marks data format" });
    }

    const now = new Date();
    const marksToSave = [];
    const marksToUpdate = [];
    const studentIds = marks_data.map(s => s.student_id);

    // Get existing marks
    const existingMarks = await db.examResults.findAll({
      where: {
        exam_id,
        academic_year,
        student_id: studentIds
      }
    });

    // Create existing marks map
    const existingMarksMap = {};
    existingMarks.forEach(mark => {
      const key = `${mark.student_id}_${mark.subject_code}`;
      existingMarksMap[key] = mark;
    });

    // Get all unique subject codes from marks data
    const subjectCodes = [...new Set(
      marks_data.flatMap(s => Object.keys(s.marks))
    )];

    // Get subject codes with their subject_ids
    const subjectCodeRecords = await db.subjectCode.findAll({
      where: {
        code: subjectCodes,
        class_id: class_id
      },
      attributes: ['code', 'subject_id']
    });

    // Create map of valid codes to subject IDs
    const validSubjectMap = {};
    subjectCodeRecords.forEach(sc => {
      validSubjectMap[sc.code] = sc.subject_id;
    });

    // Validate all requested codes exist
    const invalidCodes = subjectCodes.filter(code => !validSubjectMap[code]);
    if (invalidCodes.length > 0) {
      return res.status(400).json({
        error: "Invalid subject codes",
        invalidCodes,
        message: `The following subject codes are not valid for this class: ${invalidCodes.join(', ')}`
      });
    }

    // Process each student's marks
    marks_data.forEach(studentData => {
      Object.entries(studentData.marks).forEach(([subject_code, marks]) => {
        // Skip if marks are empty or not a number
        if (marks === "" || marks === null || isNaN(marks)) return;

        const numericMarks = parseFloat(marks);
        const key = `${studentData.student_id}_${subject_code}`;
        const markData = {
          student_id: studentData.student_id,
          exam_id,
          subject_code,
          subject_id: validSubjectMap[subject_code],
          marks_obtained: numericMarks,
          academic_year,
          class_id,
          section_id,
          created_at: now,
          updated_at: now
        };

        if (existingMarksMap[key]) {
          marksToUpdate.push({
            id: existingMarksMap[key].id,
            data: markData
          });
        } else {
          marksToSave.push(markData);
        }
      });
    });

    // Use transaction for atomic operations
    await db.sequelize.transaction(async (t) => {
      // Update existing marks
      for (const mark of marksToUpdate) {
        const { id, ...dataToUpdate } = mark;
        await db.examResults.update(
          dataToUpdate,
          { where: { id }, transaction }
        );

      }


      // Insert new marks
      if (marksToSave.length > 0) {
        await db.examResults.bulkCreate(marksToSave, { transaction: t });
      }
    });

    res.json({
      success: true,
      message: "Marks saved successfully",
      stats: {
        created: marksToSave.length,
        updated: marksToUpdate.length
      }
    });

  } catch (error) {
    console.error("Error saving bulk marks:", error);
    res.status(500).json({
      error: "Error saving bulk marks",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Get sections by class for dropdown
const getSectionsByClass = async (req, res) => {
  try {
    const { class_id } = req.query;
    const sections = await SectionList.findAll({
      where: { class_id },
      attributes: ['id', 'section_name'],
      order: [['section_name', 'ASC']]
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: "Error fetching sections" });
  }
};



module.exports = {
  loadExamTypeForm,
  getSectionsByClass,
  saveTerm,
  createExam,
  deleteTerm,
  loadExamForm,
  searchresult,
  addstudentsMarks,
  getBulkMarksData,
  saveBulkMarks
};
