module.exports = (sequelize, DataTypes) => {
    return sequelize.define("payment", {
      amount_paid: DataTypes.DECIMAL(10, 2),
      payment_date: DataTypes.DATE,
      payment_mode: DataTypes.STRING(50),
    });
  };