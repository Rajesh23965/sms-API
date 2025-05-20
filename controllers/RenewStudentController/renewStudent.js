const db = require('../../models');
const { Op } = require('sequelize');

module.exports = {
  //load form
  displayPromotionPage: async (req, res) => {
    const error = req.flash('error')[0] || "";
    const success = req.flash('success')[0] || "";

    try {
      // Fetch all classes and sections
      const classes = await db.classes.findAll({ order: [['numeric_name', 'ASC']] });
      const sections = await db.sections.findAll();

      // Fetch all current academic histories (is_current = true)
      const currentHistories = await db.student_academic_histories.findAll({
        where: { is_current: true },
        include: [
          {
            model: db.students,
            as: 'student',
            where: { status: 'active' }
          },
          {
            model: db.classes,
            as: 'class'
          },
          {
            model: db.sections,
            as: 'section'
          }
        ]
      });

      // Get academic year from first student's history (if available)
      let academicYear;
      let nextAcademicYear;
      if (currentHistories.length > 0) {
        // Use the current academic year directly from the database
        academicYear = currentHistories[0].academic_year;

        // Calculate next academic year for promotion
        const [start] = academicYear.split('-').map(Number);
        nextAcademicYear = `${start + 1}-${start + 2}`;
      } else {
        // Fallback to current year if no histories found
        const now = new Date();
        const currentYear = now.getFullYear();
        academicYear = `${currentYear}-${currentYear + 1}`;
        nextAcademicYear = `${currentYear + 1}-${currentYear + 2}`;
      }

      // Create lookup maps
      const classMap = {};
      const sectionMap = {};
      classes.forEach(cls => classMap[cls.id] = cls);
      sections.forEach(sec => sectionMap[sec.id] = sec);

      // Group academic histories by class_id
      const groupedByClass = {};
      currentHistories.forEach(history => {
        const classId = history.class_id;
        if (!groupedByClass[classId]) groupedByClass[classId] = [];
        groupedByClass[classId].push(history);
      });

      // Generate class-wise statistics
      const enhancedClasses = await Promise.all(classes.map(async (cls, index) => {
        const nextClass = classes[index + 1];
        const histories = groupedByClass[cls.id] || [];

        const studentIds = histories.map(h => h.student_id);
        const studentsWithExams = await db.students.findAll({
          where: { id: studentIds },
          include: [{
            model: db.examResults,
            as: 'examResults',
            include: [{
              model: db.subjectCode,
              as: 'subjectCodeRef',
              where: { class_id: cls.id },
              required: false,
              include: [{
                model: db.subjects,
                as: 'subject',
                required: true
              }]
            }]
          }]
        });

        // Verify the subject count query
        const requiredSubjectsCount = await db.subjectCode.count({
          where: { class_id: cls.id }
        });

        let passedStudents = 0;
        let failedStudents = 0;
        let noExamStudents = 0;

        studentsWithExams.forEach(student => {
          if (!student.examResults || student.examResults.length === 0) {
            noExamStudents++;
            return;
          }

          const subjectResults = {};
          student.examResults.forEach(result => {
            const subjectId = result.subjectCodeRef?.subject_id;
            if (subjectId && (!subjectResults[subjectId] || result.createdAt > subjectResults[subjectId].createdAt)) {
              subjectResults[subjectId] = result;
            }
          });

          if (Object.keys(subjectResults).length < requiredSubjectsCount) {
            noExamStudents++;
            return;
          }

          const passedAll = Object.values(subjectResults).every(result => {
            const subject = result.subjectCodeRef?.subject;
            const passed = subject && result.marks_obtained >= subject.passmarks;
            if (!passed) {
              console.log(`Student ${student.id} failed subject ${subject.id} with marks ${result.marks_obtained} (needed ${subject.passmarks})`);
            }
            return passed;
          });

          if (passedAll) {
            passedStudents++;
          } else {
            failedStudents++;
          }
        });


        return {
          ...cls.toJSON(),
          studentCount: histories.length,
          passedStudents,
          failedStudents,
          noExamStudents,
          nextClass: nextClass ? {
            id: nextClass.id,
            class_name: nextClass.class_name
          } : null
        };
      }));

      // Render promotion page
      res.render('promotion/promote', {
        classes: enhancedClasses,
        sections,
        academicYear,
        nextYear: nextAcademicYear,
        classMap,
        sectionMap,
        error,
        success,
        title: "Students Promotion Management",
        header: "Promotion Setup",
        headerIcon: "fa-solid fa-arrow-up-right-dots",
        buttons: [
          { text: "Back", href: "/students/student-form", color: "red", icon: "fa-solid fa-backward" },

        ]
      });

    } catch (error) {
      console.error('Promotion page error:', error);
      req.flash('error', 'Failed to load promotion page');
      res.redirect('/dashboard');
    }
  },

  //promote all student from one class to another class
  promoteStudents: async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
      const classes = await db.classes.findAll({
        order: [['numeric_name', 'ASC']],
        transaction
      });

      let totalPromoted = 0;
      const results = [];

      // Process from highest to lowest class
      for (let i = classes.length - 1; i >= 0; i--) {
        const currentClass = classes[i];
        const nextClass = classes[i + 1];

        if (!nextClass) {
          results.push({
            class: currentClass.class_name,
            promoted: 0,
            message: 'No higher class - graduation'
          });
          continue;
        }

        const currentHistories = await db.student_academic_histories.findAll({
          where: {
            class_id: currentClass.id,
            is_current: 1
          },
          include: [{
            model: db.students,
            as: 'student',
            required: true,
            where: { status: 'active' }
          }],
          transaction
        });

        if (!currentHistories.length) {
          results.push({
            class: currentClass.class_name,
            promoted: 0,
            message: 'No active students in class'
          });
          continue;
        }
        const [startYear] = currentHistories[0].academic_year.split('-').map(Number);
        const nextAcademicYear = `${startYear + 1}-${startYear + 2}`;
        let classPromoted = 0;
        for (const history of currentHistories) {
          try {
            // Check if student passed (add your actual pass/fail logic here)
            const passed = true; // Replace with your actual pass/fail logic

            if (passed) {
              // Update current academic history to not current
              await db.student_academic_histories.update({
                is_current: 0,
                status: 'promoted'
              }, {
                where: { id: history.id },
                transaction
              });

              // Create new academic history for next year
              await db.student_academic_histories.create({
                student_id: history.student_id,
                academic_year: nextAcademicYear,
                class_id: nextClass.class_id,
                section_id: history.section_id,
                roll_number: history.roll_number,
                status: 'promoted',
                is_current: true,
                promotion_date: new Date()
              }, { transaction });

              classPromoted++;
              totalPromoted++;
            }
          } catch (error) {
            console.error(`Error promoting student ${history.student_id}:`, error);
            // Continue with next student even if one fails
          }
        }
        results.push({
          class: currentClass.class_name,
          promoted: classPromoted,
          nextClass: nextClass.class_name
        });
      }
      await transaction.commit();
      req.flash('success', `Successfully promoted ${totalPromoted} students`);
      res.json({
        success: true,
        message: `Promoted ${totalPromoted} students`,
        results
      });
      res.redirect('/promotion');
    } catch (error) {
      await transaction.rollback();
      console.error('Promotion error:', error);
      req.flash('error', error.message || 'Promotion failed');
      res.status(500).json({
        success: false,
        message: error.message || 'Promotion failed'
      });
      res.redirect('/promotion');
    }
  },

  // Manual promotion form
  getManualPromotionForm: async (req, res) => {
    try {
      const { studentId } = req.params;

      // Get current academic history of the student with admission_no
      const currentHistory = await db.student_academic_histories.findOne({
        where: {
          student_id: studentId,
          is_current: true
        },
        include: [
          {
            model: db.classes,
            as: 'class',
            required: false
          },
          {
            model: db.sections,
            as: 'section',
            required: false
          },
          {
            model: db.students,
            as: 'student',
            required: true,
            attributes: ['id', 'first_name', 'last_name', 'admission_no'] // Include admission_no
          }
        ]
      });

      if (!currentHistory) {
        req.flash('error', 'Student current academic record not found');
        return res.redirect('/students/student-list');
      }

      // Get all classes with higher numeric value than current class
      const classes = await db.classes.findAll({
        where: {
          numeric_name: { [Op.gt]: currentHistory.class?.numeric_name || 0 }
        },
        order: [['numeric_name', 'ASC']]
      });

      // Calculate next academic year
      let nextAcademicYear = '';
      if (currentHistory.academic_year) {
        const [startYear] = currentHistory.academic_year.split('-').map(Number);
        nextAcademicYear = `${startYear + 1}-${startYear + 2}`;
      } else {
        const currentYear = new Date().getFullYear();
        nextAcademicYear = `${currentYear}-${currentYear + 1}`;
      }

      res.render('promotion/manual-promotion', {
        student: currentHistory.student,
        currentClass: currentHistory.class || { class_name: 'Not assigned' },
        currentSection: currentHistory.section || { section_name: 'Not assigned' },
        currentAcademicYear: currentHistory.academic_year || 'Not set',
        classes,
        nextAcademicYear,
        admission_no: currentHistory.student.admission_no // Pass admission_no to view
      });
    } catch (error) {
      console.error('Manual promotion form error:', error);
      req.flash('error', 'Failed to load manual promotion form');
      res.redirect(`/students/student-list/${req.params.studentId}`);
    }
  },
  processManualPromotion: async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
      const { studentId } = req.params;
      const { class_id, section_id, academic_year, reason } = req.body;

      // Validate inputs
      if (!class_id) {
        req.flash('error', 'Class is required');
        return res.redirect(`/promotion/manual/${studentId}`);
      }

      if (!academic_year || !academic_year.match(/^\d{4}-\d{4}$/)) {
        req.flash('error', 'Invalid academic year format. Use YYYY-YYYY');
        return res.redirect(`/promotion/manual/${studentId}`);
      }

      // Get current academic history with student info
      const currentHistory = await db.student_academic_histories.findOne({
        where: {
          student_id: studentId,
          is_current: true
        },
        include: [
          {
            model: db.classes,
            as: 'class',
            required: false
          },
          {
            model: db.students,
            as: 'student',
            required: true
          }
        ],
        transaction
      });

      if (!currentHistory) {
        req.flash('error', 'Current academic record not found');
        return res.redirect(`/promotion/manual/${studentId}`);
      }

      // Get the student's admission number
      const admission_no = currentHistory.student.admission_no;
      if (!admission_no) {
        throw new Error('Student admission number not found');
      }

      // Get new class
      const newClass = await db.classes.findByPk(class_id, { transaction });
      if (!newClass) {
        req.flash('error', 'Class not found');
        return res.redirect(`/promotion/manual/${studentId}`);
      }

      // Validate promotion is to a higher class
      if (currentHistory.class && newClass.numeric_name <= currentHistory.class.numeric_name) {
        req.flash('error', 'Cannot promote to same or lower class');
        return res.redirect(`/promotion/manual/${studentId}`);
      }

      // Validate section belongs to the new class if provided
      if (section_id) {
        const section = await db.sections.findOne({
          where: { id: section_id, class_id: class_id },
          transaction
        });
        if (!section) {
          req.flash('error', 'Invalid section for selected class');
          return res.redirect(`/promotion/manual/${studentId}`);
        }
      }

      // Update current history to mark as not current
      await db.student_academic_histories.update(
        { is_current: false, status: 'promoted' },
        { where: { id: currentHistory.id }, transaction }
      );

      // Create new academic history record with admission_no
      await db.student_academic_histories.create({
        student_id: studentId,
        admission_no: admission_no, // Include admission_no
        class_id: class_id,
        section_id: section_id || null,
        academic_year: academic_year,
        is_current: true,
        status: 'promoted',
        promotion_date: new Date(),
        remarks: reason || null
      }, { transaction });

      await transaction.commit();
      req.flash('success', 'Student promoted successfully');
      res.redirect(`/students/student-form?studentId=${studentId}`);
    } catch (error) {
      await transaction.rollback();
      console.error('Manual promotion error:', error);
      req.flash('error', 'Failed to promote student: ' + error.message);
      res.redirect(`/promotion/manual/${req.params.studentId}`);
    }
  },

  //get individual student promotion history
  getPromotionHistory: async (req, res) => {
    try {
      const { studentId } = req.params;

      const history = await db.student_academic_histories.findAll({
        where: { student_id: studentId },
        include: [
          {
            model: db.students,
            as: 'student',
            attributes: ['id', 'first_name', 'middle_name', 'last_name']
          },
          {
            model: db.classes,
            as: 'class',
            required: false,
            attributes: ['id', 'class_name']
          },
          {
            model: db.sections,
            as: 'section',
            required: false,
            attributes: ['id', 'section_name']
          }
        ],
        order: [['academic_year', 'DESC']]
      });

      res.render('promotion/history', {
        history,
        formatDate: (date) => date ? new Date(date).toDateString() : 'N/A'
      });
    } catch (error) {
      console.error('History error:', error);
      req.flash('error', 'Failed to load promotion history');
      res.redirect('/students');
    }
  },

  //get setion
  getClassSections: async (req, res) => {
    try {
      const { class_id } = req.params;

      const sections = await db.sections.findAll({
        where: { class_id },
        attributes: ['id', 'section_name'],
        order: [['section_name', 'ASC']]
      });

      res.json(sections);
    } catch (error) {
      console.error('Get sections error:', error);
      res.status(500).json({ error: 'Failed to load sections' });
    }
  }
};