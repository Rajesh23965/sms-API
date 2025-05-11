const { Op } = require("sequelize");
const db = require("../../models");
const StudentClass = db.classes;
const SubjectClass = db.subjectClass
const Section = db.sections;
const Subject = db.subjects;
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
    const redirectURL = `/classes/class-form`;
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

const getSectionsByClasses = async (req, res) => {
  try {
    const { classIds } = req.body;
    if (!classIds || classIds.length === 0) {
      return res.json([]);
    }
    const sections = await Section.findAll({
      where: {
        class_id: classIds
      }
    });

    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Error fetching sections' });
  }
};

const getSubjectsByClassAndSections = async (req, res) => {
  try {
    const { sectionIds, classIds } = req.body;

    if (!sectionIds || sectionIds.length === 0 || !classIds || classIds.length === 0) {
      return res.json([]);
    }

    const subjects = await SubjectClass.findAll({
      where: {
        section_id: { [Op.in]: sectionIds },
        class_id: { [Op.in]: classIds }
      },
      include: [
        {
          model: db.subjects,
          as: 'subject',
          include: [{
            model: db.subjectCode,
            as: 'subjectCodes',
            where: {
              class_id: { [Op.in]: classIds }
            },
            required: false
          }]
        }
      ]
    });

    const uniqueSubjects = [];
    const seenSubjectIds = new Set();

    subjects.forEach(sc => {
      const subj = sc.subject;
      if (subj && !seenSubjectIds.has(subj.id)) {
        seenSubjectIds.add(subj.id);

        // Get the first subject code (since hasMany returns an array)
        const subjectCode = subj.subjectCodes && subj.subjectCodes.length > 0
          ? subj.subjectCodes[0].code
          : 'N/A';

        uniqueSubjects.push({
          id: subj.id,
          name: subj.name,
          code: subjectCode,
          class_id: sc.class_id,
          section_id: sc.section_id
        });
      }
    });

    res.json(uniqueSubjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Error fetching subjects' });
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

//To get Total Class
const getTotalClass = async (req, res) => {
  try {
    const count = await StudentClass.count();
    res.json({ totalClass: count });
  } catch (error) {
    console.error("Failed to count class:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
// To Get Subject Details By ID
const viewClassDetails = async (req, res) => {
  try {
      const subject = await db.subjects.findByPk(req.params.id, {
          include: [
              {
                  model: db.subjectCode,
                  as: 'subjectCodes',
                  attributes: ['code']
              },
              {
                  model: db.classes,
                  as: 'classes',
                  through: {
                      attributes: []
                  },
                  attributes: ['class_name']
              },
              {
                  model: db.sections,
                  as: 'sections',
                  through: {
                      attributes: []
                  },
                  attributes: ['section_name']
              }
          ]
      });

      if (!subject) {
          return res.status(404).json({ error: 'Subject not found' });
      }

      res.json({
          id: subject.id,
          name: subject.name,
          passmarks: subject.passmarks,
          fullmarks: subject.fullmarks,
          creditHour: subject.creditHour,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt,
          subjectCodes: subject.subjectCodes,
          classes: subject.classes,
          sections: subject.sections
      });
  } catch (error) {
      console.error('Error fetching subject details:', error);
      res.status(500).json({ error: 'Error fetching subject details' });
  }
};

module.exports = { loadClassForm, addorupdateClass, deleteClass, getTotalClass, getSectionsByClasses, getSubjectsByClassAndSections, viewClassDetails };
