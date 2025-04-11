module.exports = (sequelize, DataTypes) => {
    return sequelize.define("fee", {
      fee_type: DataTypes.STRING(100),
      amount: DataTypes.DECIMAL(10, 2),
      due_date: DataTypes.DATE,
      status: DataTypes.STRING(10),
    });
  };
  