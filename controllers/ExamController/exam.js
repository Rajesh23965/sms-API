const { Op } = require("sequelize");
const validator = require("validator");
const db = require("../../models");
const ExamTypeModel = db.exams;
const ClassModel = db.classes;
const StudentModel = db.students;
const SubjectModel = db.subjects;
const SectionModel = db.sections;

const loadExamForm = async (req, res) => {
  res.render("exam/examform");
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
  const searchedText = (req.query.q || "").trim();
  const searchedType = (req.query.type || "").trim();

  try {
    let results = [];

    if (searchedType === "exam_type") {
      results = await ExamTypeModel.findAll({
        where: {
          name: { [Op.like]: `%${searchedText}%` },
        },
        limit: 10,
      });
    } else if (searchedType === "class") {
      results = await ClassModel.findAll({
        where: {
          class_name: { [Op.like]: `%${searchedText}%` },
        },
        limit: 10,
      });
    } else if (searchedType === "subject") {
      results = await SubjectModel.findAll({
        where: {
          name: { [Op.like]: `%${searchedText}%` },
        },
        limit: 10,
      });
    } else if (searchedType === "section") {
      results = await SectionModel.findAll({
        where: {
          section_name: { [Op.like]: `%${searchedText}%` },
        },
        limit: 10,
      });
    } else if (searchedType === "student") {
      results = await StudentModel.findAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.like]: `%${searchedText}%` } },
            { middle_name: { [Op.like]: `%${searchedText}%` } },
            { last_name: { [Op.like]: `%${searchedText}%` } },
          ],
        },
        limit: 10,
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Server error while searching." });
  }
};

module.exports = {
  loadExamTypeForm,
  addorupdateExamType,
  deleteExamType,
  loadExamForm,
  searchresult,
};
