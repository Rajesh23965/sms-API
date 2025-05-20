const fs = require('fs');
const path = require('path');
const { Op } = require("sequelize");
const db = require("../../models");
const Teacher = db.teachers;
const ClasList = db.classes;
const Subject = db.subjects;
const Section = db.sections;
const SubjectClass = db.subjectClass

const loadteacherform = async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const success = req.flash("success")[0];
    const error = req.flash("error")[0];
    const oldInput = req.flash("oldInput")[0] || {};
    const errorFields = req.flash("errorFields")[0] || [];

    const allClass = await ClasList.findAll();
    const allSections = await Section.findAll();
    const allSubjects = await Subject.findAll();

    let teacherData = {};

    if (teacherId) {
      const teacher = await Teacher.findByPk(teacherId);
      if (teacher) {
        const parseIds = (ids) => {
          if (!ids) return [];
          if (Array.isArray(ids)) return ids;
          if (typeof ids === 'string') return ids.split(",").filter(Boolean);
          return [ids.toString()];
        };
        const formatDate = (date) => {
          if (!date) return '';
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };


        teacherData = {
          ...teacher.toJSON(),
          class_id: parseIds(teacher.class_id),
          section_id: parseIds(teacher.section_id),
          subject_id: parseIds(teacher.subject_id),
          joining_date: formatDate(teacher.joining_date)
        };
      }
    }

    const selectedClassIds = oldInput.class_id?.length ?
      (Array.isArray(oldInput.class_id) ? oldInput.class_id : [oldInput.class_id]) :
      teacherData.class_id || [];

    const selectedSectionIds = oldInput.section_id?.length ?
      (Array.isArray(oldInput.section_id) ? oldInput.section_id : [oldInput.section_id]) :
      teacherData.section_id || [];

    const selectedSubjectIds = oldInput.subject_id?.length ?
      (Array.isArray(oldInput.subject_id) ? oldInput.subject_id : [oldInput.subject_id]) :
      teacherData.subject_id || [];

    let filteredSections = [];
    let filteredSubjects = [];

    if (selectedClassIds.length > 0) {
      filteredSections = await Section.findAll({
        where: {
          class_id: selectedClassIds
        }
      });

      if (selectedSectionIds.length > 0) {
        filteredSubjects = await Subject.findAll({
          include: [{
            model: Section,
            as: 'sections',
            where: { id: selectedSectionIds },
            through: { attributes: [] }
          }]
        });
      }
    }

    res.render("teachers/teacherform", {
      success,
      error,
      oldInput: Object.keys(oldInput).length ? oldInput : teacherData,
      errorFields,
      allClass,
      allSections: filteredSections.length ? filteredSections : allSections,
      allSubjects: filteredSubjects.length ? filteredSubjects : allSubjects,
      selectedClassIds,
      selectedSectionIds,
      selectedSubjectIds,
      teacherId,
      title: "Teacher Management",
      header: "Teacher Setup",
      headerIcon: "fas fa-user-graduate",
      buttons: [
        { text: "Teacher List", href: "/teachers/teacher-list", color: "red", icon: "fas fa-users" },
      ]
    });
  } catch (error) {
    console.error("Error loading teacher form:", error);
    req.flash("error", "Failed to load teacher form");
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
      "gender",
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
      gender: teacherData.gender,
      class_id: classIds,
      section_id: sectionIds,
      subject_id: subjectIds,
    };
    if (req.file) {
      teacherPayload.image = req.file.filename;
    }

    if (teacherId) {
      const teacher = await Teacher.findByPk(teacherId);
      if (!teacher) {
        req.flash("error", "Teacher not found.");
        return res.redirect("/teachers/teacher-form");
      }
      if (teacherData.removeImage === "on" && teacher.image) {
        const imagePath = path.join(__dirname, '../../public/uploads/teachers', teacher.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        teacherPayload.image = null;
      }


      // If a new file is uploaded, replace the old image
      if (req.file) {
        if (teacher.image) {
          const oldImagePath = path.join(__dirname, '../../public/uploads/teachers', teacher.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath); // Delete old image
          }
        }
        teacherPayload.image = req.file.filename;
      }



      await teacher.update(teacherPayload);
      req.flash("success", "Teacher updated successfully.");
    } else {
      await Teacher.create(teacherPayload);
      req.flash("success", "Teacher added successfully.");
    }
    return res.redirect("/teachers/teacher-list");

  } catch (error) {
    console.error("Error processing teacher:", error);
    req.flash("error", "Server error. Please try again.");
    req.flash("oldInput", req.body);
    return res.redirect("/teachers/teacher-form");
  }
};

const loadteacherlist = async (req, res) => {
  try {
    const success = req.flash("success")[0];
    const error = req.flash("error")[0];
    const oldInput = req.flash("oldInput")[0] || {};
    const errorFields = req.flash("errorFields")[0] || [];

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    const whereClause = {};

    if (searchQuery) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { email: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: teacherlist } = await Teacher.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const allClasses = await ClasList.findAll();
    const allSections = await Section.findAll();
    const allSubjects = await Subject.findAll();

    const classMap = Object.fromEntries(allClasses.map(cls => [cls.id.toString(), cls.class_name]));
    const sectionMap = Object.fromEntries(allSections.map(sec => [sec.id.toString(), sec.section_name]));
    const subjectMap = Object.fromEntries(allSubjects.map(sub => [sub.id.toString(), sub.name]));

    const formattedTeachers = teacherlist.map(teacher => {
      const classIds = teacher.class_id?.split(",") || [];
      const sectionIds = teacher.section_id?.split(",") || [];
      const subjectIds = teacher.subject_id?.split(",") || [];

      const classNames = classIds.map(id => classMap[id] || 'Unknown').join(", ");
      const sectionNames = sectionIds.map(id => sectionMap[id] || 'Unknown').join(", ");
      const subjectNames = subjectIds.map(id => subjectMap[id] || 'Unknown').join(", ");

      return {
        ...teacher.toJSON(),
        classNames,
        sectionNames,
        subjectNames
      };
    });

    const totalPages = Math.ceil(count / limit);

    res.render("teachers/teacherlist", {
      teacherlist: formattedTeachers,
      searchQuery,
      pagination: {
        totalItems: count,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        paginationStart: Math.max(1, page - 2),
        paginationEnd: Math.min(totalPages, page + 2),
        limit,
        startEntry: offset + 1,
        endEntry: Math.min(offset + limit, count),
      },
      success,
      error,
      oldInput,
      errorFields,
      title: "Teacher Management",
      header: "Teacher Setup",
      headerIcon: "fas fa-user-graduate",
      buttons: [
        { text: "Add Teacher", href: "/teachers/teacher-form", color: "red", icon: "fas fa-user-plus" },
      ]
    });
  } catch (err) {
    console.error("Error loading teacher list:", err);
    req.flash("error", "Failed to load teacher list.");
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
  let imagePath = null;
  try {
    const id = req.params.id;
    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
      req.flash("error", "Teacher not found");
      return res.redirect("/teachers/teacher-list");
    }


    if (teacher.image) {
      try {
        imagePath = path.join(
          process.cwd(),
          'public',
          'uploads',
          'teachers',
          teacher.image
        );



        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Successfully deleted image: ${imagePath}`);
        } else {
          console.log(`Image not found at: ${imagePath}`);
          const altPath = path.join(__dirname, '../public/uploads/teachers', teacher.image);
          if (fs.existsSync(altPath)) {
            fs.unlinkSync(altPath);
            console.log(`Deleted image using alternative path: ${altPath}`);
          }
        }
      } catch (fileError) {
        console.error("Error deleting teacher image:", fileError);
      }
    }

    await teacher.destroy();

    req.flash("success", "Teacher deleted successfully");
    return res.redirect("/teachers/teacher-list");
  } catch (error) {
    console.error("Error deleting teacher:", error);

    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Async deletion also failed:", err);
        } else {
          console.log("Image deleted successfully in async mode");
        }
      });
    }

    req.flash("error", "Failed to delete teacher");
    return res.redirect("/teachers/teacher-list");
  }
};

//Count Total Teacher
const getTotalTeacher = async (req, res) => {
  try {
    const count = await Teacher.count();
    res.json({ totalTeachers: count });
  } catch (error) {
    console.error("Failed to count teachers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = {
  loadteacherform,
  addorupdateteacher,
  loadteacherlist,
  getSectionsByClasses,
  getSubjectsBySections,
  deleteTeacher,
  getTotalTeacher
};
