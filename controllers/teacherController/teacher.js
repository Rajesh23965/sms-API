const db = require("../../models");
const Teacher = db.teachers;
const ClasList = db.classes;
// const Subject = db.subjects;
const Section = db.sections;

const loadteacherform = async (req, res) => {
  const success = req.flash("success")[0];
  const error = req.flash("error")[0];
  const oldInput = req.flash("oldInput")[0] || {};
  const errorFields = req.flash("errorFields")[0] || [];

  const allClass = await ClasList.findAll();
  // const allsubject = await Subject.findAll();
  const allSections = await Section.findAll();

  res.render("teachers/teacherform", {
    success,
    error,
    oldInput,
    errorFields,
    allClass,
    // allsubject,
    allSections,
  });
};

const addorupdateteacher = async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const teacherData = req.body;

    const redirectURL = teacherId
      ? `/teachers/teacher-form?teacherId=${teacherId}`
      : "/teachers/teacher-form";

    const requiredFields = [
      "name",
      "email",
      "phone",
      "qualification",
      "address",
      "joining_date",
      "status",
      "class_id",
      "section_id",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        !teacherData[field] || teacherData[field].toString().trim() === ""
    );

    if (missingFields.length) {
      req.flash("errorFields", JSON.stringify(missingFields));
      req.flash("oldInput", {
        ...teacherData,
        class_id: req.body.class_id,
        section_id: req.body.section_id,
      });
      return res.redirect(redirectURL);
    }

    const existingEmail = await Teacher.findOne({
      where: { email: teacherData.email },
    });

    if (
      existingEmail &&
      (!teacherId || existingEmail.id !== parseInt(teacherId))
    ) {
      req.flash("error", "Email already exists.");
      req.flash("oldInput", {
        ...teacherData,
        class_id: req.body.class_id,
        section_id: req.body.section_id,
      });
      req.flash("errorFields", JSON.stringify(["email"]));
      return res.redirect(redirectURL);
    }

    const classIds = Array.isArray(req.body.class_id)
      ? req.body.class_id.join(",")
      : req.body.class_id || "";
    const sectionIds = Array.isArray(req.body.section_id)
      ? req.body.section_id.join(",")
      : req.body.section_id || "";

    const teacherPayload = {
      ...teacherData,
      class_id: classIds,
      section_id: sectionIds,
    };

    if (teacherId) {
      const teacher = await Teacher.findByPk(teacherId);

      if (!teacher) {
        req.flash("error", "Teacher not found.");
        return res.redirect("/teachers/teacher-form");
      }

      await teacher.update(teacherPayload);
      req.flash("success", "Teacher updated successfully.");
    } else {
      await Teacher.create(teacherPayload);
      req.flash("success", "Teacher added successfully.");
    }

    return res.redirect("/teachers/teacher-form");
  } catch (error) {
    console.error("Error processing teacher:", error);
    req.flash("error", "Server error. Please try again.");
    req.flash("oldInput", {
      ...req.body,
      class_id: req.body.class_id,
      section_id: req.body.section_id,
    });
    return res.redirect("/teachers/teacher-form");
  }
};

const loadteacherlist = async (req, res) => {
  const teacherlist = await Teacher.findAll();
  res.render("teachers/teacherlist", {
    teacherlist,
  });
};

module.exports = {
  loadteacherform,
  addorupdateteacher,
  loadteacherlist,
};
