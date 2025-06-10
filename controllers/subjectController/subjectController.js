const { Op } = require("sequelize");
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

        // Pagination and search parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        // Build the where clause for search
        const whereClause = {};
        if (searchQuery) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${searchQuery}%` } },
            ];
        }

        // Fetch subject data with all associations if editing
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

        // Prepare class-section mappings for the form
        const classSectionMappings = {};
        if (subjectData) {
            subjectData.subject_classes.forEach(sc => {
                if (!classSectionMappings[sc.class_id]) {
                    classSectionMappings[sc.class_id] = [];
                }
                classSectionMappings[sc.class_id].push(sc.section_id);
            });
        }


        // Fetch paginated subjects with their class and section associations
        const { count, rows: subjects } = await Subject.findAndCountAll({
            where: whereClause,
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
            distinct: true,
            order: [['name', 'ASC']],
            limit,
            offset
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

        // Calculate pagination details
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        const nextPage = hasNextPage ? page + 1 : null;
        const previousPage = hasPreviousPage ? page - 1 : null;
        const paginationStart = Math.max(1, page - 2);
        const paginationEnd = Math.min(totalPages, page + 2);

        res.render("subjects/subjectform", {
            errorFields,
            oldInput,
            listclass,
            subjectData,
            subjects,
            subjectId,
            success,
            error,
            classSectionMappings: JSON.stringify(classSectionMappings),
            searchQuery,
            pagination: {
                totalItems: count,
                currentPage: page,
                totalPages,
                hasNextPage,
                hasPreviousPage,
                nextPage,
                previousPage,
                paginationStart,
                paginationEnd,
                limit
            },
            title: "Subject Management",
            header: "Subject Setup",
            headerIcon: "fas fa-layer-group",
            buttons: [
                {
                    text: "Add Subject",
                    href: "/subjects/subject-form",
                    color: "bg-primary",
                    icon: "fas fa-plus"
                }
            ]
        });
    } catch (err) {
        console.error('Error in loadSubjectForm:', err);
        req.flash('error', 'Error loading subject form');
        res.redirect('/subjects/subject-form');
    }
};

const addOrUpdateSubject = async (req, res) => {
    try {
        const { name, passmarks, practicalPassmarks, practicalMarks, fullmarks, creditHour, section_mapping } = req.body;
        const subjectId = req.query.subjectId;
        const redirectURL = "/subjects/subject-form";

        // Parse mappings: "1_2" => { class_id: 1, section_id: 2 }
        const class_sections = (section_mapping || []).map(mapping => {
            const [class_id, section_id] = mapping.split('_').map(Number);
            return {
                class_id,
                section_id,
                passmarks,
                fullmarks,
                practicalMarks,
                practicalPassmarks,
                creditHour
            };
        });

        // Input validation
        if (!name || !passmarks || !fullmarks || !creditHour || class_sections.length === 0) {
            req.session.errorFields = ["name", "passmarks", "fullmarks", "creditHour", "section_mapping"];
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
            subject.practicalMarks = practicalMarks;
            subject.practicalPassmarks = practicalPassmarks;
            subject.creditHour = creditHour;
            await subject.save();

            // Remove existing associations
            await SubjectClass.destroy({ where: { subject_id: subjectId } });
            await SubjectCode.destroy({ where: { subject_id: subjectId } });

            req.session.success = "Subject updated successfully.";
        } else {
            // Create new subject
            subject = await Subject.create({
                name,
                passmarks,
                fullmarks,
                practicalMarks,
                practicalPassmarks,
                creditHour
            });
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
                practicalMarks: cs.practicalMarks,
                practicalPassmarks: cs.practicalPassmarks,
                fullmarks: cs.fullmarks,
                creditHour: cs.creditHour
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

