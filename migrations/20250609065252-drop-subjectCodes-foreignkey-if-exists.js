'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all foreign keys on subjectClasses
    const [results] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'subjectClasses'
        AND REFERENCED_TABLE_NAME IS NOT NULL;
    `);

    // Find the FK you want to drop by some criteria — for example, referencing the target table
    // For example, suppose you want to drop FK referencing 'subjectCodes' table
    const fkToDrop = results.find(fk => fk.CONSTRAINT_NAME.includes('subjectCodes'));

    if (fkToDrop) {
      await queryInterface.sequelize.query(`
        ALTER TABLE subjectClasses DROP FOREIGN KEY \`${fkToDrop.CONSTRAINT_NAME}\`;
      `);
      console.log(`Dropped FK ${fkToDrop.CONSTRAINT_NAME}`);
    } else {
      console.log('No matching FK found to drop');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back FK if necessary
  }
};
