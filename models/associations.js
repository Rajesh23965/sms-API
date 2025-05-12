module.exports = (db) => {
  // ========== Class & Section ==========
  db.sections.belongsTo(db.classes, { foreignKey: "class_id", as: "class" });
  db.classes.hasMany(db.sections, { foreignKey: "class_id", as: "sections" });

  // ========== Student ==========

  db.subjectClass.belongsTo(db.subjectCode, {
    foreignKey: 'subject_id',
    targetKey: 'subject_id',
    as: 'subjectCode'
  });


  db.subjectClass.hasMany(db.subjectCode, {
    foreignKey: 'subject_id',
    as: 'subjectCodes'
  });

  // ========== Exam Results Associations ==========
  db.examResults.belongsTo(db.subjectCode, {
    foreignKey: 'subject_code',
    targetKey: 'code',
    as: 'subjectCodeRef'
  });

  // SubjectCode has many ExamResults
  db.subjectCode.hasMany(db.examResults, {
    foreignKey: 'subject_code',
    sourceKey: 'code',
    as: 'examResults'
  });

  // ========== Teacher ==========
  db.teachers.belongsTo(db.classes, {
    foreignKey: "class_id",
    onDelete: "NO ACTION",
    onUpdate: "CASCADE",
    as: "class"
  });
  db.teachers.belongsTo(db.sections, { foreignKey: "section_id", as: "section" });
  db.classes.hasMany(db.teachers, { foreignKey: "class_id", as: "teachers" });
  db.sections.hasMany(db.teachers, {
    foreignKey: "section_id",
    as: "teachers"
  });

  // ========== Subject ==========
  db.subjectCode.belongsTo(db.subjects, { foreignKey: "subject_id", as: "subject" });
  db.subjects.hasMany(db.subjectClass, {
    foreignKey: "subject_id",
    as: "subject_classes",
  });


  db.subjects.hasMany(db.subjectCode, {
    foreignKey: "subject_id",
    as: "subjectCodes"
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
  db.examResults.belongsTo(db.students, { foreignKey: "student_id", as: 'student' });


  // ========== Attendance ==========
  db.attendance.belongsTo(db.students, { foreignKey: "student_id", as: "student" });

  // ========== Fees ==========
  db.fees.belongsTo(db.students, { foreignKey: "student_id", as: "student" });
  db.payments.belongsTo(db.fees, { foreignKey: "fee_id" });

  // ========== Teacher Schedule ==========
  db.teachers.hasMany(db.teacherSchedule, {
    foreignKey: "teacher_id", as: "schedules"
  });
  db.teacherSchedule.belongsTo(db.teachers, {
    foreignKey: "teacher_id", as: "teacher"
  });

  db.subjects.hasMany(db.teacherSchedule, { foreignKey: "subject_id", as: "schedules" });
  db.teacherSchedule.belongsTo(db.subjects, {
    foreignKey: "subject_id", as: "subject"
  });

  db.classes.hasMany(db.teacherSchedule, {
    foreignKey: "class_id", as: "schedules"
  });
  db.teacherSchedule.belongsTo(db.classes, { foreignKey: "class_id", as: "class" });

  db.sections.hasMany(db.teacherSchedule, {
    foreignKey: "section_id", as: "schedules"
  });
  db.teacherSchedule.belongsTo(db.sections, { foreignKey: "section_id", as: "section" });

  // ========== Redundant Fixes ==========
  db.sections.hasMany(db.subjectClass, { foreignKey: "section_id" });
  db.subjectClass.belongsTo(db.sections, { foreignKey: "section_id" });

  db.subjects.hasMany(db.subjectClass, { foreignKey: "subject_id" });
  db.subjectClass.belongsTo(db.subjects, { foreignKey: "subject_id" });


  db.subjects.belongsToMany(db.sections, {
    through: db.subjectClass,
    foreignKey: "subject_id",
    as: "sections"
  });
  db.sections.belongsToMany(db.subjects, {
    through: db.subjectClass,
    foreignKey: "section_id",
    as: "subjects"
  });

  db.students.hasMany(db.examResults, {
    foreignKey: 'student_id',
    as: 'examResults'
  });


  // Student-Subject Relationships
  db.students.belongsToMany(db.subjects, {
    through: db.studentSubjects,
    foreignKey: "student_id",
    as: "subjects"
  });

  db.subjects.belongsToMany(db.students, {
    through: db.studentSubjects,
    foreignKey: "subject_id",
    as: "students"
  });
  db.students.hasMany(db.attendance, {
    foreignKey: "student_id",
    as: "attendances"
  });
  db.students.hasMany(db.fees, {
    foreignKey: "student_id",
    as: "fees"
  });
  db.fees.hasMany(db.payments, {
    foreignKey: "fee_id",
    as: "payments"
  });

//student and academic year relation

// Student to Academic History (One-to-Many)
db.students.hasMany(db.student_academic_histories, {
  foreignKey: 'student_id',
  as: 'academicHistories'
});

db.student_academic_histories.belongsTo(db.students, {
  foreignKey: 'student_id',
  as: 'student'
});

// Class to Academic History (One-to-Many)
db.classes.hasMany(db.student_academic_histories, {
  foreignKey: 'class_id',
  as: 'studentHistories'
});

db.student_academic_histories.belongsTo(db.classes, {
  foreignKey: 'class_id',
  as: 'class'
});

// Section to Academic History (One-to-Many)
db.sections.hasMany(db.student_academic_histories, {
  foreignKey: 'section_id',
  as: 'studentHistories'
});

db.student_academic_histories.belongsTo(db.sections, {
  foreignKey: 'section_id',
  as: 'section'
});



db.terms.hasMany(db.exams, {
  foreignKey: 'term_id',
  as: 'exams'
});

db.exams.belongsTo(db.terms, {
  foreignKey: 'term_id',
  as: 'term'
});

};
