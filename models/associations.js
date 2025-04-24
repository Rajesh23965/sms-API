module.exports = (db) => {
  // ========== Class-Related ==========
  db.sections.belongsTo(db.classes, { foreignKey: "class_id" }); // Section belongs to a Class
  db.subjects.belongsTo(db.classes, { foreignKey: "class_id" }); // Subject belongs to a Class
  db.students.belongsTo(db.classes, { foreignKey: "class_id" }); // Student belongs to a Class

  db.classes.hasMany(db.sections, { foreignKey: "class_id", as: "sections" }); // Class has many sections
  db.sections.belongsTo(db.classes, { foreignKey: "class_id" }); // Section belongs to a Class

  // ========== Section-Related ==========
  db.students.belongsTo(db.sections, { foreignKey: "section_id" }); // Student belongs to a Section
  db.teachers.belongsTo(db.sections, { foreignKey: "section_id" }); // Teacher belongs to a Section

  // ========== Subject-Related ==========
  db.studentSubjects.belongsTo(db.subjects, { foreignKey: "subject_id" }); // Student-Subject belongs to Subject
  db.teachers.belongsTo(db.subjects, { foreignKey: "subject_id" }); // Teacher teaches a Subject

  // ========== Teacher-Related ==========
  db.teachers.belongsTo(db.classes, { foreignKey: "class_id" }); // Teacher assigned to a Class

  // ========== Student-Subject Mapping ==========
  db.studentSubjects.belongsTo(db.students, { foreignKey: "student_id" }); // Student-Subject belongs to Student

  // ========== Exam & Result ==========
  db.examResults.belongsTo(db.exams, { foreignKey: "exam_id" }); // ExamResult belongs to Exam
  db.examResults.belongsTo(db.students, { foreignKey: "student_id" }); // ExamResult belongs to Student
  db.examResults.belongsTo(db.subjects, { foreignKey: "subject_id" }); // ExamResult belongs to Subject

  // ========== Attendance ==========
  db.attendance.belongsTo(db.students, { foreignKey: "student_id" }); // Attendance belongs to Student

  // ========== Fees & Payments ==========
  db.fees.belongsTo(db.students, { foreignKey: "student_id" }); // Fee belongs to Student
  db.payments.belongsTo(db.fees, { foreignKey: "fee_id" }); // Payment belongs to Fee

  // ========== Subject has many codes ==========
  db.subjects.hasMany(db.subjectCode, { foreignKey: 'subject_id' });
  db.subjectCode.belongsTo(db.subjects, { foreignKey: 'subject_id' });


};
