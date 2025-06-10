module.exports = (db) => {
  // ========== Class & Section ==========
  db.sections.belongsTo(db.classes, { foreignKey: "class_id", as: "class" });
  db.classes.hasMany(db.sections, { foreignKey: "class_id", as: "sections" });

  // ========== Student ==========

  db.subjectClass.belongsTo(db.subjectCode, {
    foreignKey: 'subject_id',
    targetKey: 'subject_id',
    as: 'subjectCode',
    constraints: false 
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




  // Attendance Relationships
  db.students.hasMany(db.attendance, {
    foreignKey: 'student_id',
    as: 'attendances'
  });

  db.attendance.belongsTo(db.students, {
    foreignKey: 'student_id',
    as: 'student'
  });

  db.student_academic_histories.hasMany(db.attendance, {
    foreignKey: 'academic_history_id',
    as: 'attendances'
  });

  db.attendance.belongsTo(db.student_academic_histories, {
    foreignKey: 'academic_history_id',
    as: 'academic_history'
  });

  db.teachers.hasMany(db.attendance, {
    foreignKey: 'recorded_by',
    as: 'recorded_attendances'
  });

  db.attendance.belongsTo(db.teachers, {
    foreignKey: 'recorded_by',
    as: 'recorded_by_teacher'
  });

  // Attendance Summary Relationships
  db.students.hasMany(db.attendance_summary, {
    foreignKey: 'student_id',
    as: 'attendance_summaries'
  });

  db.attendance_summary.belongsTo(db.students, {
    foreignKey: 'student_id',
    as: 'student'
  });

  db.student_academic_histories.hasMany(db.attendance_summary, {
    foreignKey: 'academic_history_id',
    as: 'attendance_summaries'
  });

  db.attendance_summary.belongsTo(db.student_academic_histories, {
    foreignKey: 'academic_history_id',
    as: 'academic_history'
  });

  // Holiday/Leave Relationships
  db.classes.hasMany(db.holidays_leaves, {
    foreignKey: 'class_id',
    as: 'holidays_leaves'
  });

  db.holidays_leaves.belongsTo(db.classes, {
    foreignKey: 'class_id',
    as: 'class'
  });

  db.sections.hasMany(db.holidays_leaves, {
    foreignKey: 'section_id',
    as: 'holidays_leaves'
  });

  db.holidays_leaves.belongsTo(db.sections, {
    foreignKey: 'section_id',
    as: 'section'
  });

  db.students.hasMany(db.holidays_leaves, {
    foreignKey: 'student_id',
    as: 'leaves'
  });

  db.holidays_leaves.belongsTo(db.students, {
    foreignKey: 'student_id',
    as: 'student'
  });

  // School Relationships
  db.schoolinfo.hasMany(db.students, {
    foreignKey: 'school_id',
    as: 'students'
  });

  db.students.belongsTo(db.schoolinfo, {
    foreignKey: 'school_id',
    as: 'school'
  });

  db.schoolinfo.hasMany(db.teachers, {
    foreignKey: 'school_id',
    as: 'teachers'
  });

  db.teachers.belongsTo(db.schoolinfo, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Self-association for parent-child menu structure
  db.home_layout.hasMany(db.home_layout, { foreignKey: 'parent_id', as: 'children' });
  db.home_layout.belongsTo(db.home_layout, { foreignKey: 'parent_id', as: 'parent' });
  ``
  // home_layout → home_layout_url
  db.home_layout.hasMany(db.home_layout_url, { foreignKey: 'layout_id', as: 'urls' });
  db.home_layout_url.belongsTo(db.home_layout, { foreignKey: 'layout_id', as: 'layout' });

  // home_layout → role
  db.home_layout.belongsTo(db.role, { foreignKey: 'access_to', as: 'role' });
  db.role.belongsTo(db.home_layout, { foreignKey: 'home_layout_id', as: 'home_layout' });
  db.role.belongsTo(db.home_layout_url, { foreignKey: 'home_layout_url_id', as: 'home_layout_url' });
  // home_layout → role
  db.admins.belongsTo(db.role, { foreignKey: 'role_id', as: 'role' });

db.home_layout.belongsToMany(db.role, {
    through: 'home_layout_roles',
    foreignKey: 'home_layout_id',
    otherKey: 'role_id',
    as: 'roles'
});

db.role.belongsToMany(db.home_layout, {
    through: 'home_layout_roles',
    foreignKey: 'role_id',
    otherKey: 'home_layout_id',
    as: 'layouts'
});



};

