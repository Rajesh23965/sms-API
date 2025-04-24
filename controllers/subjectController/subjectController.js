const db = require("../../models");
const SubjectClass = db.subjectClass;
const Subject = db.subjects;
const SubjectCode = db.subjectCode;
const SubjectTeacher = db.subjectTeacher;


const addSubject = async (req, res) => {
    try {
        const { name, code, class_id, teacher_id } = req.body;

        if (!name || !code?.length || !class_id?.length || !teacher_id?.length) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

        // Create subject
        const subject = await Subject.create({ name, class_id, teacher_id });

        // Add multiple codes
        for (let c of code) {
            await SubjectCode.create({ code: c, subject_id: subject.id });
        }

        // Add subject-class associations
        for (let cid of class_id) {
            await SubjectClass.create({ subject_id: subject.id, class_id: cid });
        }

        // Add subject-teacher associations
        for (let tid of teacher_id) {
            await SubjectTeacher.create({ subject_id: subject.id, teacher_id: tid });
        }

        res.status(201).json({
            success: true,
            message: "Subject created with multiple codes, classes, and teachers",
            subject,
        });

    } catch (error) {
        console.error("Error while creating subject:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

const getAllSubject = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                error: "Invalid pagination parameters",
                details: {
                    receivedPage: req.query.page,
                    receivedLimit: req.query.lmit,
                    parsedpage: page,
                    parsedLimit: limit

                }
            });
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await Subject.findAndCountAll({
            offset, limit, order: [["createdAt", "DESC"]]
        });
        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true, message: "Subject fetched successfully", subject: rows,
            pagination: {
                totalRecords: count,
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        })
    } catch (error) {
        console.log("Error to fetch", error);
        res.status(500).json({ success: false, error: "Internal Server Error", error });
    }
}

const getSubjectById = async (req, res) => {
    try {
        const id = req.params.id;

        const subject = await Subject.findByPk(id);
        if (!subject) {
            return res.status(404).json({
                success: false, error: "Subject Not Found"
            });
        }
        res.status(200).json({ success: true, message: "Subject fetched successfully", subject: subject })
    } catch (error) {
        console.log("Error to fetch", error);
        res.status(500).json({ success: false, error: "Internal Server Error", error });
    }
}

const updateSubject = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, code, class_id, teacher_id } = req.body;
        const subject = await Subject.findByPk(id);
        if (!subject) {
            return res.status(404).json({ success: false, error: "Subject Not Found" });
        }
        subject.name = name || subject.name;
        await subject.save();

        if (code?.length) {
            await SubjectCode.destroy({ where: { subject_id: id } });
            for (let c of code) {
                await SubjectCode.create({ code: c, subject_id: id });
            }
        }

        if (class_id?.length) {

            await SubjectClass.destroy({ where: { subject_id: id } });


            for (let cid of class_id) {
                await SubjectClass.create({ subject_id: id, class_id: cid });
            }
        }


        if (teacher_id?.length) {

            await SubjectTeacher.destroy({ where: { subject_id: id } });


            for (let tid of teacher_id) {
                await SubjectTeacher.create({ subject_id: id, teacher_id: tid });
            }
        }
        res.status(200).json({
            success: true,
            message: "Subject updated successfully",
            subject
        });

    } catch (error) {
        console.error("Error while updating subject:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subject exists
        const subject = await Subject.findByPk(id);
        if (!subject) {
            return res.status(404).json({ success: false, error: "Subject not found" });
        }

        // Delete all associated subject codes
        await SubjectCode.destroy({ where: { subject_id: id } });

        // Delete all associated class mappings
        await SubjectClass.destroy({ where: { subject_id: id } });

        // Delete all associated teacher mappings
        await SubjectTeacher.destroy({ where: { subject_id: id } });

        // Delete the subject itself
        await subject.destroy();

        res.status(200).json({
            success: true,
            message: "Subject and all associated data deleted successfully",
        });
    } catch (error) {
        console.error("Error while deleting subject:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};


module.exports = {
    addSubject,
    getAllSubject,
    getSubjectById,
    updateSubject,
    deleteSubject
};