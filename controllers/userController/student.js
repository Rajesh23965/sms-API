
const db = require("../../models");
const Student = db.students;

const addStudent = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            gender,
            dob,
            address,
            phone,
            email,
            admission_no,
            admission_date,
            status,
            image
        } = req.body;


        if (!first_name || !last_name || !gender || !dob || !address || !phone || !email || !admission_no || !admission_date) {
            return res.status(400).json({ error: "All fields are required." });
        }


        const existingEmail = await Student.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: "Email already registered." });
        }

        const existingAdmissionNo = await Student.findOne({ where: { admission_no } });
        if (existingAdmissionNo) {
            return res.status(400).json({ error: "Admission number already exists." });
        }

        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: "Invalid phone number format." });
        }

        const newStudent = await Student.create({
            first_name,
            last_name,
            gender,
            dob,
            address,
            phone,
            email,
            admission_no,
            admission_date,
            status: status || "active",
            image,
        });

        res.status(201).json({
            message: "Student added successfully.",
            student: newStudent,
        });

    } catch (error) {
        console.error("Error creating student:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    addStudent,
};
