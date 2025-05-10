const { Op } = require("sequelize");
const validator = require("validator");
const db = require("../../models");
const ExamTypeModel = db.exams;
const ExamResultModel = db.examResults;

const loadExamForm = async (req, res) => {
  const examTypeList = await ExamTypeModel.findAll();
  const error = req.session.error || "";
  const success = req.session.success || "";
  const examTypeId = req.session.examTypeId || "";

  req.session.error = null;
  req.session.success = null;
  req.session.examTypeId = null;

  res.render("exam/examform", {
    examTypeList,
    error,
    success,
    examTypeId,
  });
};

const searchresult = async (req, res) => {
  try {
    const searchedText = (req.query.q || "").trim();

    if (!searchedText) return res.json({});


    const student = await db.students.findOne({
      where: {
        admission_no: searchedText,
      },
      include: [
        {
          model: db.classes,
          as: "class",
          attributes: ["id", "class_name", "numeric_name"],
        },
        {
          model: db.sections,
          as: "section",
          attributes: ["id", "section_name"],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get subject classes
    const subjectClasses = await db.subjectClass.findAll({
      where: {
        class_id: student.class_id,
        section_id: student.section_id,
      },
      include: [
        {
          model: db.subjects,
          as: "subject",
          attributes: ["id", "name"],
        }
      ],
    });

    // Get subject codes separately
    const subjectCodes = await db.subjectCode.findAll({
      where: {
        class_id: student.class_id
      },
      attributes: ['subject_id', 'code']
    });

    // Create a map of subject_id to code for easier lookup
    const codeMap = {};
    subjectCodes.forEach(code => {
      codeMap[code.subject_id] = code.code;
    });

    // Format the response
    const response = {
      ...student.toJSON(),
      subjects: subjectClasses.map(sc => ({
        id: sc.subject.id,
        name: sc.subject.name,
        code: codeMap[sc.subject_id] || '',
        passmarks: sc.passmarks,
        fullmarks: sc.fullmarks
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
// adjust path as needed

const addstudentsMarks = async (req, res) => {
  try {
    const { admissionNumber, examType, ...subjectMarks } = req.body;

    if (!admissionNumber || !examType) {
      req.session.error = "Registration number & Exam type are required.";
      return res.redirect("/exams/exam-form");
    }

    const student = await db.students.findOne({
      where: { admission_no: admissionNumber },
      include: [
        {
          model: db.classes,
          as: "class",
          attributes: ["id"],
        },
        {
          model: db.sections,
          as: "section",
          attributes: ["id"],
        },
      ],
    });

    if (!student) {
      req.session.error = "Student not found.";
      return res.redirect("/exams/exam-form");
    }

    const studentId = student.id;
    const marksToSave = [];
    const errors = [];
    const subjectCodes = [];

    // First get all subject classes for this student's class and section
    const subjectClasses = await db.subjectClass.findAll({
      where: {
        class_id: student.class.id,
        section_id: student.section.id,
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

    // Create a map of subject codes to their full marks
    const subjectFullMarks = {};
    subjectClasses.forEach(sc => {
      const code = sc.subjectCode?.code;
      if (code) {
        subjectFullMarks[code] = sc.fullmarks;
      }
    });

    // Check for existing exam results for this student and exam type
    const existingResults = await db.examResults.findAll({
      where: {
        student_id: studentId,
        exam_id: examType,
      },
      attributes: ['subject_code'],
    });

    const existingSubjects = existingResults.map(result => result.subject_code);

    // Process each subject mark
    for (const [fieldName, marks] of Object.entries(subjectMarks)) {
      if (!marks) continue;

      if (fieldName.endsWith('_obtained')) {
        const subjectCode = fieldName.replace('_obtained', '');

        // Check for duplicate subject codes in current submission
        if (subjectCodes.includes(subjectCode)) {
          errors.push(`Duplicate entry for subject ${subjectCode} in this submission`);
          continue;
        }
        subjectCodes.push(subjectCode);

        // Check if marks already exist for this subject and exam
        if (existingSubjects.includes(subjectCode)) {
          errors.push(`Marks for ${subjectCode} already entered for this exam`);
          continue;
        }

        const fullMarks = subjectFullMarks[subjectCode];

        // Validate marks are numeric
        if (isNaN(marks)) {
          errors.push(`Marks for ${subjectCode} must be a number`);
          continue;
        }

        const numericMarks = parseFloat(marks);

        // Validate marks don't exceed full marks
        if (fullMarks !== undefined && numericMarks > fullMarks) {
          errors.push(`Marks for ${subjectCode} cannot exceed ${fullMarks}`);
          continue;
        }

        // Validate marks are not negative
        if (numericMarks < 0) {
          errors.push(`Marks for ${subjectCode} cannot be negative`);
          continue;
        }

        marksToSave.push({
          student_id: studentId,
          exam_id: examType,
          subject_code: subjectCode,
          marks: numericMarks,
        });
      }
    }

    if (errors.length > 0) {
      req.session.error = errors.join('');
      return res.redirect("/exams/exam-form");
    }

    if (marksToSave.length === 0) {
      req.session.error = "No valid marks provided.";
      return res.redirect("/exams/exam-form");
    }

    await ExamResultModel.bulkCreate(marksToSave);
    req.session.success = "Marks added successfully";
    req.session.examTypeId = examType;

    return res.redirect("/exams/exam-form");
  } catch (error) {
    console.error("Error saving student marks:", error);
    req.session.error = "Server error while saving marks.";
    return res.redirect("/exams/exam-form");
  }
};


//exam type functionality
const loadExamTypeForm = async (req, res) => {
  const error = req.session.error || "";
  const success = req.session.success || "";
  const oldInput = req.session.oldInput || {};
  const errorFields = req.session.errorFields || [];

  req.session.error = null;
  req.session.success = null;
  req.session.oldInput = null;
  req.session.errorFields = null;

  const rawExamTypeId = req.query.examTypeId || "";
  const examTypeId = validator.escape(rawExamTypeId.trim());

  let examDetails = null;

  const examTypelist = await ExamTypeModel.findAll();

  if (examTypeId) {
    examDetails = await ExamTypeModel.findByPk(examTypeId);

    if (!examDetails) {
      req.session.error = "Invalid Exam Type ID";
      return res.redirect("/exam/exam-form");
    }
  }

  res.render("exam/examTypeform", {
    errorFields,
    oldInput,
    success,
    error,
    examTypelist,
    examDetails,
  });
};

const addorupdateExamType = async (req, res) => {
  const examTypeData = req.body;
  const redirectURL = "/exams/exam-form";
  const rawExamTypeId = req.query.examTypeId || "";
  const examTypeId = validator.escape(rawExamTypeId.trim());

  try {
    const requiredFields = ["name", "start_date", "end_date"];
    const missingFields = requiredFields.filter(
      (field) => !examTypeData[field]
    );

    if (missingFields.length) {
      req.session.error = "All fields are required.";
      req.session.oldInput = examTypeData;
      req.session.errorFields = missingFields;
      return res.redirect(
        redirectURL + (examTypeId ? `?examTypeId=${examTypeId}` : "")
      );
    }

    // If examTypeId is provided, check if the name already exists, excluding the current record
    let existingExam = null;
    if (examTypeId) {
      existingExam = await ExamTypeModel.findOne({
        where: {
          name: !examTypeData.name,
          id: { [Op.ne]: examTypeId },
        },
      });
    } else {
      // If no examTypeId (new exam), check for duplicate name
      existingExam = await ExamTypeModel.findOne({
        where: {
          name: examTypeData.name,
        },
      });
    }

    // res.send(existingExam);

    if (existingExam) {
      req.session.error = "Duplicate exam name";
      req.session.oldInput = examTypeData;
      req.session.errorFields = ["name"];
      return res.redirect(
        redirectURL + (examTypeId ? `?examTypeId=${examTypeId}` : "")
      );
    }

    if (examTypeId) {
      // If updating an existing record, update the exam type
      const updated = await ExamTypeModel.update(
        { ...examTypeData },
        { where: { id: examTypeId } }
      );

      if (updated[0] === 0) {
        req.session.error = "Update failed. Exam type not found.";
      } else {
        req.session.success = "Exam type updated successfully!";
      }
    } else {
      // Create a new exam type
      const exam = await ExamTypeModel.create({
        ...examTypeData,
      });

      if (exam) {
        req.session.success = "Exam type created successfully!";
      }
    }

    return res.redirect(redirectURL);
  } catch (error) {
    console.error("Error processing exam:", error);
    req.session.error = "Server error. Please try again later.";
    req.session.oldInput = req.body;
    return res.redirect(redirectURL);
  }
};

const deleteExamType = async (req, res) => {
  const examTypeId = req.query.examTypeId || "";

  if (!examTypeId) {
    req.session.error = "Invalid id";
    return res.redirect("/exams/exam-form");
  }

  try {
    const deleteExamType = await ExamTypeModel.destroy({
      where: { id: examTypeId },
    });

    if (deleteExamType) {
      req.session.success = "Deleted successfully";
      return res.redirect("/exams/exam-form");
    }
  } catch {
    req.session.error = "Invalid Id or server error";
    return res.redirect("/exams/exam-form");
  }
};

module.exports = {
  loadExamTypeForm,
  addorupdateExamType,
  deleteExamType,
  loadExamForm,
  searchresult,
  addstudentsMarks,
};
