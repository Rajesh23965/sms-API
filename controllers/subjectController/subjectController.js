const db = require("../../models");
const Subject = db.subjects;
const SubjectClass = db.subjectClass;
const SubjectCode = db.subjectCode;
const SubjectTeacher = db.subjectTeacher;
const StudentClass = db.classes;
const Teacher = db.teachers;

const loadSubjectForm = async (req, res) => {
    try {
        const subjectId = req.query.subjectId;
        const errorFields = req.session.errorFields || [];
        const oldInput = req.session.oldInput || {};
        const success = req.session.success || "";
        const error = req.session.error || "";
        req.session.errorFields = null;
        req.session.oldInput = null;
        req.session.success = null;
        req.session.error = null;

        // Fetch subject data with all associations
        const subjectData = subjectId
            ? await Subject.findByPk(subjectId, {
                include: [
                    {
                        model: SubjectClass,
                        as: 'subject_classes',
                        include: [
                            {
                                model: StudentClass,
                                as: 'class',
                                attributes: ['id', 'class_name']
                            },
                            {
                                model: db.sections,
                                as: 'section',
                                attributes: ['id', 'section_name', 'class_id']
                            }
                        ]
                    }
                ],
            })
            : null;

        // Fetch all subjects with their class and section associations
        const subjects = await Subject.findAll({
            include: [{
                model: SubjectClass,
                as: 'subject_classes',
                separate: true,
                include: [
                    {
                        model: StudentClass,
                        as: 'class',
                        attributes: ['id', 'class_name']
                    },
                    {
                        model: db.sections,
                        as: 'section',
                        attributes: ['id', 'section_name', 'class_id'],

                    }
                ]
            }],
            order: [['name', 'ASC']]
        });

        // Get all classes with their sections for the form dropdowns
        const listclass = await StudentClass.findAll({
            include: [{
                model: db.sections,
                as: 'sections',
                attributes: ['id', 'section_name']
            }],
            order: [['class_name', 'ASC']]
        });
        const listsection = await StudentClass.findAll();
        const teacherlist = await Teacher.findAll({
            order: [['name', 'ASC']]
        });


        res.render("subjects/subjectform", {
            errorFields,
            oldInput,
            listclass,
            listsection,
            teacherlist,
            subjectData,
            subjects,
            subjectId,
            success,
            error
        });
    } catch (err) {
        console.error('Error in loadSubjectForm:', err);
        res.status(500).send("Server Error");
    }
};


const addOrUpdateSubject = async (req, res) => {
    try {
        const { name, passmarks, fullmarks, section_mapping } = req.body;
        const subjectId = req.query.subjectId;
        const redirectURL = "/subjects/subject-form";

        // Parse mappings: "1_2" => { class_id: 1, section_id: 2 }
        const class_sections = (section_mapping || []).map(mapping => {
            const [class_id, section_id] = mapping.split('_').map(Number);
            return {
                class_id,
                section_id,
                passmarks,
                fullmarks
            };
        });

        // Input validation
        if (!name || !passmarks || !fullmarks || class_sections.length === 0) {
            req.session.errorFields = ["name", "passmarks", "fullmarks", "section_mapping"];
            req.session.oldInput = req.body;
            req.session.error = "All fields are required.";
            return res.redirect(redirectURL);
        }

        if (parseInt(passmarks) >= parseInt(fullmarks)) {
            req.session.errorFields = ["passmarks", "fullmarks"];
            req.session.oldInput = req.body;
            req.session.error = "Pass marks must be less than full marks.";
            return res.redirect(redirectURL);
        }

        // Subject prefix logic (e.g. NEP from Nepali)
        const sanitize = str => str.replace(/[^A-Z]/gi, '').toUpperCase();
        const prefix = sanitize(name).substring(0, 3);

        let subject;

        if (subjectId) {
            // Update existing subject
            subject = await Subject.findByPk(subjectId);
            if (!subject) {
                req.session.error = "Subject not found.";
                return res.redirect(redirectURL);
            }

            subject.name = name;
            subject.passmarks = passmarks;
            subject.fullmarks = fullmarks;
            await subject.save();

            // Remove old class-section-code mappings
            await SubjectClass.destroy({ where: { subject_id: subjectId } });
            await SubjectCode.destroy({ where: { subject_id: subjectId } });

            req.session.success = "Subject updated successfully.";
        } else {
            // Create new subject
            subject = await Subject.create({ name, passmarks, fullmarks });
            req.session.success = "Subject added successfully.";
        }

        // Create subjectClass + subjectCode
        for (const cs of class_sections) {
            // Validate class-section relationship
            const sectionExists = await db.sections.findOne({
                where: { id: cs.section_id, class_id: cs.class_id }
            });

            if (!sectionExists) {
                console.warn(`Invalid class-section: Class ${cs.class_id}, Section ${cs.section_id}`);
                continue;
            }

            // Create SubjectClass
            await SubjectClass.create({
                subject_id: subject.id,
                class_id: cs.class_id,
                section_id: cs.section_id,
                passmarks: cs.passmarks,
                fullmarks: cs.fullmarks
            });

            // Generate subject code like NEP01, SCI02
            const classInfo = await db.classes.findByPk(cs.class_id);
            const classNumber = classInfo.class_number || classInfo.id;
            const codeSuffix = String(classNumber).padStart(2, '0'); // e.g., 01
            const baseCode = `${prefix}${codeSuffix}`;
            let subjectCode = baseCode;

            // Ensure code uniqueness
            let counter = 1;
            while (await SubjectCode.findOne({ where: { code: subjectCode } })) {
                subjectCode = `${baseCode}${counter++}`; // NEP01, NEP011, NEP012
            }

            // Create SubjectCode if not exists
            const existingCode = await SubjectCode.findOne({
                where: {
                    subject_id: subject.id,
                    class_id: cs.class_id
                }
            });

            if (!existingCode) {
                await SubjectCode.create({
                    subject_id: subject.id,
                    code: subjectCode,
                    class_id: cs.class_id
                });
            }
        }

        return res.redirect(redirectURL);
    } catch (error) {
        console.error("Error in addOrUpdateSubject:", error);
        req.session.errorFields = Object.keys(req.body);
        req.session.oldInput = req.body;
        req.session.error = "Something went wrong!";
        return res.redirect("/subjects/subject-form");
    }
};

const deleteSubject = async (req, res) => {
    try {
        const id = req.params.id;
        const subject = await Subject.findByPk(id);
        if (!subject) {
            req.session.error = "Subject not found.";
            return res.redirect("/subjects/subject-form");
        }

        await SubjectCode.destroy({ where: { subject_id: id } });
        await SubjectClass.destroy({ where: { subject_id: id } });
        await SubjectTeacher.destroy({ where: { subject_id: id } });
        await subject.destroy();

        req.session.success = "Subject deleted successfully.";
        res.redirect("/subjects/subject-form");
    } catch (error) {
        console.error("Error deleting subject:", error);
        req.session.error = "Internal server error.";
        res.redirect("/subjects/subject-form");
    }
};

const getSectionsByClass = async (req, res) => {
    try {
        const classId = req.params.classId;
        const sections = await db.sections.findAll({
            where: { class_id: classId },
            attributes: ['id', 'section_name']
        });

        res.json(sections);
    } catch (error) {
        console.error("Error fetching sections:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = {
    loadSubjectForm,
    addOrUpdateSubject,
    deleteSubject,
    getSectionsByClass
};

