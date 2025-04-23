const db = require("../../models");
const StudentClass = db.classes;

const loadClassForm = async (req, res) => {
  const studentClassId = req.query.classId;
  const errorFields = req.session.errorFields || [];
  const oldInput = req.session.oldInput || {};
  const success = req.session.success || "";
  const error = req.session.error || "";
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
    error
  });
};

const addorupdateClass = async (req, res) => {
  try {
    const classData = req.body;
    const studentClassId = req.query.classId;
    const redirectURL = `/classes/class-form`;


    const classExists = await StudentClass.findOne({
      where: { class_name: classData.class_name },
    });

    if (
      classExists &&
      (!studentClassId || classExists.id !== parseInt(studentClassId))
    ) {
      req.session.errorFields = ["class_name"];
      req.session.oldInput = classData;
      req.session.error = "Class already exists";
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
    req.session.error = "Internal server error";
    res.redirect("/classes/class-form");
  }
};

const deleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    const studentClassData = await StudentClass.findByPk(id);
    if (!studentClassData) {
      req.session.error = "Class not found";
      return res.redirect("/classes/class-form");
    }

    await studentClassData.destroy();
    req.session.success = "Class Deleted Successfully";
    return res.redirect("/classes/class-form");
  } catch (error) {
    console.error("Error deleting class:", error);
    req.session.errorFields = ["class_name"];
    req.session.oldInput = req.body;
    req.session.error = "Internal server error";
    return res.redirect("/classes/class-form");
  }
};
module.exports = { loadClassForm, addorupdateClass, deleteClass };
