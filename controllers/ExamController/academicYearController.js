
const db = require("../../models");
const { Op } = require("sequelize");

const AcademicYearController = {
  // Get current academic year
  getCurrentAcademicYear: async () => {
    try {
      return await db.academicYears.findOne({
        where: { is_current: true }
      });
    } catch (error) {
      console.error("Error getting current academic year:", error);
      return null;
    }
  },

  // Set current academic year
  setCurrentAcademicYear: async (yearId) => {
    const transaction = await db.sequelize.transaction();
    try {
      // Reset all current flags
      await db.academicYears.update(
        { is_current: false },
        { where: {}, transaction }
      );

      // Set new current year
      await db.academicYears.update(
        { is_current: true },
        { where: { id: yearId }, transaction }
      );

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error("Error setting academic year:", error);
      return false;
    }
  },

  // Get all academic years
  getAllAcademicYears: async () => {
    try {
      return await db.academicYears.findAll({
        order: [["start_date", "DESC"]]
      });
    } catch (error) {
      console.error("Error getting academic years:", error);
      return [];
    }
  },

  // Create new academic year
  createAcademicYear: async (data) => {
    try {
      // Validate date format (YYYY-YYYY)
      if (!data.name.match(/^\d{4}-\d{4}$/)) {
        throw new Error("Academic year must be in YYYY-YYYY format");
      }

      // Check for overlapping dates
      const overlapping = await db.academicYears.findOne({
        where: {
          [Op.or]: [
            {
              start_date: { [Op.lte]: data.end_date },
              end_date: { [Op.gte]: data.start_date }
            }
          ]
        }
      });

      if (overlapping) {
        throw new Error("Academic year dates overlap with existing year");
      }

      return await db.academicYears.create(data);
    } catch (error) {
      console.error("Error creating academic year:", error);
      throw error;
    }
  }
};

module.exports = AcademicYearController;