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

const searchresult = async (req, res) => {
  try {
    const searchedText = (req.query.q || "").trim();

    // If no search query is provided
    if (!searchedText) return res.json({});

    // Try to find the student with related class and section
    const result = await db.students.findOne({
      where: {
        admission_no: searchedText,
      },
      include: [
        {
          model: db.classes,
          as: "class",
          attributes: ["id", "class_name", "numeric_name"],
          include: [
            {
              model: db.subjects,
              as: "subjects",
              attributes: ["id", "name", "code"],
            },
          ], // Adding the subjects associated with the class
        },
        {
          model: db.sections,
          as: "section",
          attributes: ["id", "section_name"],
        },
      ],
    });

    // If no student found, return empty object
    if (!result) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Returning the found student
    res.json(result);
  } catch (error) {
    console.error("Search error:", error);

    // Return a 500 error with a more descriptive message
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

    // res.send(req.body);

    if (!admissionNumber && !examType) {
      req.session.error = "Registration number & Exam type are required.";
      return req.render("/exams/exam-form");
    }

    const student = await db.students.findOne({
      where: { admission_no: admissionNumber },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentId = student.id;

    const marksToSave = [];

    for (const [subjectCode, marks] of Object.entries(subjectMarks)) {
      if (!marks) continue;

      marksToSave.push({
        student_id: studentId,
        exam_id: examType,
        subject_code: subjectCode,
        marks: marks,
      });
    }

    // res.send(marksToSave);

    if (marksToSave.length === 0) {
      return res.status(400).json({ message: "No marks provided." });
    }

    // Bulk insert all marks
    await ExamResultModel.bulkCreate(marksToSave);
    req.session.success = "Marks added successfully";
    req.session.examTypeId = examType ?? "";

    return res.redirect("/exams/exam-form");
  } catch (error) {
    console.error("Error saving student marks:", error);
    return res
      .status(500)
      .json({ message: "Server error while saving marks." });
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
