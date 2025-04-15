//associations.js
module.exports = (db) => {
  //section and class relation 
  db.sections.belongsTo(db.classes, { foreignKey: "class_id" });

  //student and class relation
  db.students.belongsTo(db.classes, { foreignKey: "class_id" });

  //student and class section
  db.students.belongsTo(db.sections, { foreignKey: "section_id" });

  //student and parents relation
  db.students.belongsTo(db.parents, { foreignKey: "parent_id" });

  //subject and class relation
  db.subjects.belongsTo(db.classes, { foreignKey: "class_id" });

  //subject and class teachers
  db.subjects.belongsTo(db.teachers, { foreignKey: "teacher_id" });

  //student-subject and students relation
  db.studentSubjects.belongsTo(db.students, { foreignKey: "student_id" });

  // student-subject and subjects
  db.studentSubjects.belongsTo(db.subjects, { foreignKey: "subject_id" });

  // examResults and exam
  db.examResults.belongsTo(db.exams, { foreignKey: "exam_id" });

  // examResults and students
  db.examResults.belongsTo(db.students, { foreignKey: "student_id" });

  // examResults and subjects
  db.examResults.belongsTo(db.subjects, { foreignKey: "subject_id" });

  // attendance and student
  db.attendance.belongsTo(db.students, { foreignKey: "student_id" });

  // fees and student
  db.fees.belongsTo(db.students, { foreignKey: "student_id" });

  // payment and fees
  db.payments.belongsTo(db.fees, { foreignKey: "fee_id" });
};