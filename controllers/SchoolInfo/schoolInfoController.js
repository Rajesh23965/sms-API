const path = require("path");
const fs = require('fs');
const db = require("../../models");
const SchoolInfo = db.schoolinfo;
const Students = db.students;
const TeacherList = db.teachers;

// Load School Info Form (for create or edit)
const loadSchoolInfoForm = async (req, res) => {
    const error = req.flash("error")[0] || "";
    const success = req.flash("success")[0] || "";
    const oldInput = req.flash("oldInput")[0] || {};
    const errorFields = req.flash("errorFields")[0] || [];

    try {
        // Get school to edit (if any)
        let school = null;
        if (req.query.edit) {
            school = await SchoolInfo.findByPk(req.query.edit, {
                attributes: {
                    include: [
                        [db.sequelize.literal('(SELECT COUNT(*) FROM students WHERE students.school_id = schoolinfo.id)'), 'totalStudents'],
                        [db.sequelize.literal('(SELECT COUNT(*) FROM teachers WHERE teachers.school_id = schoolinfo.id)'), 'totalTeachers']
                    ]
                }
            });
        }

        // Get all schools for table
        const schools = await SchoolInfo.findAll({
            attributes: {
                include: [
                    [db.sequelize.literal('(SELECT COUNT(*) FROM students WHERE students.school_id = schoolinfo.id)'), 'totalStudents'],
                    [db.sequelize.literal('(SELECT COUNT(*) FROM teachers WHERE teachers.school_id = schoolinfo.id)'), 'totalTeachers']
                ]
            }
        });

        const totalTeacher = await TeacherList.count();
        const totalStudent = await Students.count();

        res.render("school/schoolinfoform", {
            school,
            schools,
            totalTeacher,
            totalStudent,
            success,
            error,
            oldInput,
            errorFields
        });

    } catch (error) {
        console.error("Error loading school info form:", error);
        res.status(500).send("Internal server error");
    }
};

const addOrUpdateSchoolInfo = async (req, res) => {
    try {
        const data = { ...req.body };

        // Convert empty strings to null for optional fields
        const optionalFields = ["phone_number", "principal_name", "website", "affiliation"];
        optionalFields.forEach(field => {
            if (data[field] === "") data[field] = null;
        });

        // Handle image upload
        if (req.file) {
            data.logo = req.file.filename;
        }

        if (data.id) {
            // Update logic
            const school = await SchoolInfo.findByPk(data.id);
            if (!school) throw new Error("School not found");

            // If "removeImage" is checked
            if (req.body.removeImage === "on" && school.logo) {
                const oldImagePath = path.join(__dirname, "../../public/uploads/school", school.logo);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
                data.logo = null;
            }

            // Replace old image if a new one is uploaded
            if (req.file && school.logo) {
                const oldImagePath = path.join(__dirname, "../../public/uploads/school", school.logo);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            await school.update(data);
            req.flash("success", "School updated successfully");
            return res.redirect(`/school/school-form?edit=${data.id}`);
        } else {
            // Create new school
            await SchoolInfo.create(data);
            req.flash("success", "School created successfully");
            return res.redirect("/school/school-form");
        }
    } catch (error) {
        console.error("Error saving school info:", error);
        req.flash("error", error.message);
        res.redirect("/school/school-form");
    }
};

const deleteSchoolInfo = async (req, res) => {
    try {
        const school = await SchoolInfo.findByPk(req.params.id);
        if (!school) {
            req.flash("error", "School not found");
            return res.redirect("/school/school-form");
        }

        // Delete image if exists
        if (school.image) {
            const imagePath = path.join(__dirname, "../../public/uploads/school", school.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await school.destroy();
        req.flash("success", "School deleted successfully");
    } catch (error) {
        console.error("Error deleting school:", error);
        req.flash("error", "Error deleting school");
    }

    res.redirect("/school/school-form");
};
module.exports = {
    loadSchoolInfoForm,
    addOrUpdateSchoolInfo,
    deleteSchoolInfo,
};
