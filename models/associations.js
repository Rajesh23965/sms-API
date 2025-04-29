module.exports = (db) => {
  // ========== Class & Section ==========
  db.sections.belongsTo(db.classes, { foreignKey: "class_id", as: "class" });
  db.classes.hasMany(db.sections, { foreignKey: "class_id", as: "sections" });

  // ========== Student ==========
  db.students.belongsTo(db.classes, { foreignKey: "class_id", as: "class" });
  db.students.belongsTo(db.sections, {
    foreignKey: "section_id",
    as: "section",
  });
  db.subjectClass.belongsTo(db.subjectCode, {
    foreignKey: 'subject_id',  // This links to the subject_id in subjectClass
    targetKey: 'subject_id',   // This links to the subject_id in subjectCode
    as: 'subjectCode'          // Use a different alias to avoid confusion
  });
  


  db.subjectCode.belongsTo(db.subjectClass, {
    foreignKey: 'subject_id',
    as: 'subjectClassInfo'  // Changed from 'subjectClass' to make unique
  });

  // SubjectClass has many SubjectCodes (with unique alias)
  db.subjectClass.hasMany(db.subjectCode, {
    foreignKey: 'subject_id',
    as: 'subjectCodeList'  // Changed from 'subjectCodes' to make unique
  });

  // ========== Exam Results Associations ==========
  // ExamResults belongs to SubjectCode
  db.examResults.belongsTo(db.subjectCode, {
    foreignKey: 'subject_code',
    targetKey: 'code',
    as: 'subjectCodeRef'  // Changed from 'subjectCode' to make unique
  });

  // SubjectCode has many ExamResults
  db.subjectCode.hasMany(db.examResults, {
    foreignKey: 'subject_code',
    sourceKey: 'code',
    as: 'examResultsList'  // Changed from 'examResults' to make unique
  });





  // ========== Teacher ==========
  db.teachers.belongsTo(db.classes, {
    foreignKey: "class_id",
    onDelete: "NO ACTION",
    onUpdate: "CASCADE",
  });
  db.teachers.belongsTo(db.sections, { foreignKey: "section_id" });
  db.classes.hasMany(db.teachers, { foreignKey: "class_id" });

  // ========== Subject ==========
  db.subjects.hasMany(db.subjectCode, { foreignKey: "subject_id", as:"subjectCodes" });
  db.subjectCode.belongsTo(db.subjects, { foreignKey: "subject_id",as:"name" });

  db.subjects.hasMany(db.subjectClass, {
    foreignKey: "subject_id",
    as: "subject_classes",
  });
  db.subjectClass.belongsTo(db.subjects, {
    foreignKey: "subject_id",
    as: "subject",
  });

  db.subjectClass.belongsTo(db.classes, {
    foreignKey: "class_id",
    as: "class",
  });
  db.subjectClass.belongsTo(db.sections, {
    foreignKey: "section_id",
    as: "section",
  });

  db.subjects.hasMany(db.subjectTeacher, {
    foreignKey: "subject_id",
    as: "subject_teachers",
  });
  db.subjectTeacher.belongsTo(db.subjects, { foreignKey: "subject_id" });
  db.subjectTeacher.belongsTo(db.teachers, {
    foreignKey: "teacher_id",
    as: "teacher",
  });

  // ========== Many-to-Many via Pivot Tables ==========
  db.subjects.belongsToMany(db.classes, {
    through: db.subjectClass,
    foreignKey: "subject_id",
    as: "classes",
  });
  db.classes.belongsToMany(db.subjects, {
    through: db.subjectClass,
    foreignKey: "class_id",
    as: "subjects",
  });

  db.subjects.belongsToMany(db.teachers, {
    through: db.subjectTeacher,
    foreignKey: "subject_id",
    as: "teachers",
  });
  db.teachers.belongsToMany(db.subjects, {
    through: db.subjectTeacher,
    foreignKey: "teacher_id",
    as: "subjects",
  });

  db.classes.hasMany(db.subjects, { foreignKey: "class_id" });

  // ========== Student-Subject ==========
  db.studentSubjects.belongsTo(db.students, { foreignKey: "student_id" });
  db.studentSubjects.belongsTo(db.subjects, { foreignKey: "subject_id" });

  // ========== Exams & Results ==========
  db.examResults.belongsTo(db.exams, { foreignKey: "exam_id" });
  db.examResults.belongsTo(db.students, { foreignKey: "student_id" });

  // You should **NOT** link subject_code as FK unless you have subjectCodes table separately
  // If you want to link subjectCode model, then use this:
  // db.examResults.belongsTo(db.subjectCode, { foreignKey: "subject_code", targetKey: "code" });

  // ========== Attendance ==========
  db.attendance.belongsTo(db.students, { foreignKey: "student_id" });

  // ========== Fees ==========
  db.fees.belongsTo(db.students, { foreignKey: "student_id" });
  db.payments.belongsTo(db.fees, { foreignKey: "fee_id" });

  // ========== Teacher Schedule ==========
  db.teachers.hasMany(db.teacherSchedule, { foreignKey: "teacher_id" });
  db.teacherSchedule.belongsTo(db.teachers, { foreignKey: "teacher_id" });

  db.subjects.hasMany(db.teacherSchedule, { foreignKey: "subject_id" });
  db.teacherSchedule.belongsTo(db.subjects, { foreignKey: "subject_id" });

  db.classes.hasMany(db.teacherSchedule, { foreignKey: "class_id" });
  db.teacherSchedule.belongsTo(db.classes, { foreignKey: "class_id" });

  db.sections.hasMany(db.teacherSchedule, { foreignKey: "section_id" });
  db.teacherSchedule.belongsTo(db.sections, { foreignKey: "section_id" });

  // ========== Redundant Fixes ==========
  db.sections.hasMany(db.subjectClass, { foreignKey: "section_id" });
  db.subjectClass.belongsTo(db.sections, { foreignKey: "section_id" });

  db.subjects.hasMany(db.subjectClass, { foreignKey: "subject_id" });
  db.subjectClass.belongsTo(db.subjects, { foreignKey: "subject_id" });
};
