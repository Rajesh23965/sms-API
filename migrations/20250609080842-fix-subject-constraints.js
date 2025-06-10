'use strict';

/** @type {import('sequelize-cli').Migration} */
// In the new migration file
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the problematic constraint exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'subjectClasses' 
      AND CONSTRAINT_NAME = 'subjectCodes_ibfk_1'
    `);

    if (results.length > 0) {
      await queryInterface.removeConstraint(
        'subjectClasses',
        'subjectCodes_ibfk_1'
      );
    }

    // Add correct constraint if needed
    await queryInterface.addConstraint('subjectClasses', {
      fields: ['subject_code_id'], // your actual FK column
      type: 'foreign key',
      name: 'fk_subject_class_code',
      references: {
        table: 'subjectCodes',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      'subjectClasses',
      'fk_subject_class_code'
    );
  }
};
