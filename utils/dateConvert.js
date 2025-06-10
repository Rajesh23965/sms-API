const { adToBs } = require('@sbmdkl/nepali-date-converter');

const convertToNepaliDate = (date) => {
  try {
    if (!date) return null;
    const bsDate = adToBs(date);
    return bsDate;
  } catch (error) {
    console.error("Date conversion error:", error);
    return null;
  }
};

module.exports = convertToNepaliDate;

