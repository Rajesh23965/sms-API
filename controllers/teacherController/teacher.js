const { Op } = require("sequelize");
const db = require("../../models");
const Teacher = db.teachers;
const ClasList = db.classes;
const Subject = db.subjects;
const Section = db.sections;
const SubjectClass = db.subjectClass

const loadteacherform = async (req, res) => {
  try {
    const success = req.flash("success")[0];
    const error = req.flash("error")[0];
    const oldInput = req.flash("oldInput")[0] || {};
    const errorFields = req.flash("errorFields")[0] || [];

    const teacherId = req.query.teacherId;

    const allClass = await ClasList.findAll();
    const allSections = await Section.findAll();
    const allSubjects = await Subject.findAll();

    let teacherData = {};

    if (teacherId) {
      const teacher = await Teacher.findByPk(teacherId);
      if (teacher) {
        teacherData = {
          ...teacher.toJSON(),
          class_id: teacher.class_id ? teacher.class_id.split(",") : [],
          section_id: teacher.section_id ? teacher.section_id.split(",") : [],
          subject_id: teacher.subject_id ? teacher.subject_id.split(",") : [],
        };

      }
    }

    const selectedClassIds = oldInput.class_id?.length ? oldInput.class_id : teacherData.class_id || [];

    // const filteredSections = selectedClassIds.length > 0
    //   ? allSections.filter(section => selectedClassIds.includes(section.class_id.toString()))
    //   : [];

    res.render("teachers/teacherform", {
      success,
      error,
      oldInput: Object.keys(oldInput).length ? oldInput : teacherData,
      errorFields,
      allClass,
      allSections,
      selectedClassIds,
      teacherId
    });
  } catch (error) {
    console.error("Error loading teacher form:", error);
    res.redirect("/teachers/teacher-list");
  }
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
      "subject_id"
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        !teacherData[field] ||
        (Array.isArray(teacherData[field])
          ? teacherData[field].length === 0
          : teacherData[field].toString().trim() === "")
    );

    if (missingFields.length) {
      req.flash("errorFields", JSON.stringify(missingFields));
      req.flash("oldInput", teacherData);
      return res.redirect(redirectURL);
    }

    const existingEmail = await Teacher.findOne({
      where: { email: teacherData.email },
    });

    if (existingEmail) {
      if (!teacherId || (parseInt(existingEmail.id) !== parseInt(teacherId))) {
        req.flash("error", "Email already exists.");
        req.flash("oldInput", teacherData);
        req.flash("errorFields", JSON.stringify(["email"]));
        return res.redirect(redirectURL);
      }
    }


    const classIds = Array.isArray(teacherData.class_id)
      ? teacherData.class_id.join(",")
      : teacherData.class_id;
    const sectionIds = Array.isArray(teacherData.section_id)
      ? teacherData.section_id.join(",")
      : teacherData.section_id;
    const subjectIds = Array.isArray(teacherData.subject_id)
      ? teacherData.subject_id.join(",")
      : teacherData.subject_id;

    const teacherPayload = {
      name: teacherData.name,
      email: teacherData.email,
      phone: teacherData.phone,
      qualification: teacherData.qualification,
      address: teacherData.address,
      joining_date: teacherData.joining_date,
      status: teacherData.status,
      class_id: classIds,
      section_id: sectionIds,
      subject_id: subjectIds,
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
    req.flash("oldInput", req.body);
    return res.redirect("/teachers/teacher-form");
  }
};

const loadteacherlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const whereClause = {};
    if (searchQuery) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: teacherlist } = await Teacher.findAndCountAll({
      where: whereClause,
      limit, offset, order: [["createdAt", "DESC"]],
      include: [{
        model: ClasList,
        as: "class",
        attributes: ['class_name']
      }, {
        model: Section,
        as: "section",
        attributes: ["section_name"]
      }, {
        model: Subject,
        as: "subjects",
        attributes: ["name"],
        through: { attributes: [] },
      },], distinct: true
    });
    const totalPages = Math.ceil(count / limit);
    const startEntry = offset + 1;
    const endEntry = Math.min(offset + limit, count);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const previousPage = hasPreviousPage ? page - 1 : null;
    const paginationStart = Math.max(1, page - 2);
    const paginationEnd = Math.min(totalPages, page + 2);
    const success = req.session.success || "";
    const error = req.session.error || "";
    req.session.success = null;
    req.session.error = null;
  
    res.render("teachers/teacherlist", {
      teacherlist,
      searchQuery, pagination: {
        totalPages: count,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage,
        previousPage,
        paginationStart,
        paginationEnd,
        limit,
        startEntry,
        endEntry
      },
      success,
      error
    })
  } catch (error) {
    console.error("Error loading teacher list:", error);
    req.session.error = "Unable to load teacher list.";
    res.redirect("/teachers/teacher-list");
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

const getSubjectsBySections = async (req, res) => {
  try {
    const { sectionIds, classIds } = req.body;

    if (!sectionIds || sectionIds.length === 0 || !classIds || classIds.length === 0) {
      return res.json([]);
    }

    const subjects = await SubjectClass.findAll({
      where: {
        section_id: sectionIds,
        class_id: classIds
      },
      include: [{
        model: db.subjects,
        as: 'subject'
      }]
    });

    const uniqueSubjects = [];
    const seenSubjects = new Set();

    subjects.forEach(sc => {
      const subj = sc.subject;
      if (subj && !seenSubjects.has(subj.id)) {
        seenSubjects.add(subj.id);
        uniqueSubjects.push(subj);
      }
    });

    res.json(uniqueSubjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Error fetching subjects' });
  }
};


const deleteTeacher = async (req, res) => {
  try {
    const id = req.params.id;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      req.session.error = "Teacher not found";
      return res.redirect("/teachers/teacher-list");
    }

    await teacher.destroy();
    req.session.success = "Teacher Deleted Successfully";
    return res.redirect("/teachers/teacher-list");
  } catch (error) {
    console.error("Error deleting teacher:", error);
    req.session.errorFields = ["errorFields"];
    req.session.oldInput = req.body;
    req.session.error = "Internal server error";
    return res.redirect("/teachers/teacher-list");
  }
};


module.exports = {
  loadteacherform,
  addorupdateteacher,
  loadteacherlist,
  getSectionsByClasses,
  getSubjectsBySections,
  deleteTeacher
};
