module.exports = (db) => {
    db.sections.belongsTo(db.classes, { foreignKey: "class_id" });
    db.students.belongsTo(db.classes, { foreignKey: "class_id" });
    db.students.belongsTo(db.sections, { foreignKey: "section_id" });
    db.students.belongsTo(db.parents, { foreignKey: "parent_id" });
    db.subjects.belongsTo(db.classes, { foreignKey: "class_id" });
    db.subjects.belongsTo(db.teachers, { foreignKey: "teacher_id" });
    db.studentSubjects.belongsTo(db.students, { foreignKey: "student_id" });
    db.studentSubjects.belongsTo(db.subjects, { foreignKey: "subject_id" });
    db.examResults.belongsTo(db.exams, { foreignKey: "exam_id" });
    db.examResults.belongsTo(db.students, { foreignKey: "student_id" });
    db.examResults.belongsTo(db.subjects, { foreignKey: "subject_id" });
    db.attendance.belongsTo(db.students, { foreignKey: "student_id" });
    db.fees.belongsTo(db.students, { foreignKey: "student_id" });
    db.payments.belongsTo(db.fees, { foreignKey: "fee_id" });
  };