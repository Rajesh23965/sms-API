const db = require("../../models");
const StudentClass = db.classes;

const loadClassForm = async (req, res) => {
  const studentClassId = req.query.classId;
  const errorFields = req.session.errorFields || [];
  const error = req.session.error || [];
  const oldInput = req.session.oldInput || {};
  const success = req.session.success || "";
  req.session.errorFields = null;
  req.session.oldInput = null;
  req.session.success = null;
  req.session.error = null;

  const studentclassById = studentClassId
    ? await StudentClass.findByPk(studentClassId)
    : null;

  const classlist = await StudentClass.findAll();
  res.render("classes/classform", {
    errorFields,
    oldInput,
    classlist,
    studentclassById,
    success,
    error,
  });
};

const addorupdateClass = async (req, res) => {
  try {
    const classData = req.body;
    const studentClassId = req.query.classId;
    const redirectURL = studentClassId
      ? `/classes/class-form?classId=${studentClassId}`
      : "/classes/class-form";

    const classExists = await StudentClass.findOne({
      where: { class_name: classData.class_name },
    });

    if (
      classExists &&
      (!studentClassId || classExists.id !== parseInt(studentClassId))
    ) {
      req.session.errorFields = ["class_name"];
      req.session.error = "Class already exist";
      req.session.oldInput = classData;
      return res.redirect(redirectURL);
    }

    if (studentClassId) {
      const studentclass = await StudentClass.findByPk(studentClassId);
      if (studentclass) {
        await studentclass.update(classData);
        req.session.success = "Class updated successfully.";
      }
    } else {
      await StudentClass.create(classData);
      req.session.success = "Class added successfully.";
    }

    res.redirect("/classes/class-form");
  } catch (error) {
    req.session.errorFields = ["class_name"];
    req.session.oldInput = req.body;
    res.redirect("/classes/class-form");
  }
};

module.exports = { loadClassForm, addorupdateClass };
