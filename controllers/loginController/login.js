const db = require("../../models");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Teacher = db.teachers;
const User = db.admins;
const revokedTokens = new Set();

const loadloginform = async (req, res) => {
  res.render("login/login");
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).render("login/login", { error: "Email and password are required" });

  try {
    // 🔐 Handle hard-coded Super Admin login
    if (email === "ithome@gmail.com" && password === "ithome123") {
      const token = jwt.sign(
        {
          id: "4", // can be any identifier
          role_id: "4",
          email: "ithome@gmail.com",
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.redirect("/");
    }

    // 👥 For regular users (check database)
    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(404).render("login/login", { error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).render("login/login", { error: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        role_id: user.role_id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.redirect("/");

  } catch (err) {
    console.error(err);
    res.status(500).render("login/login", { error: "Internal Server Error" });
  }
};


const checkUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


// Logout Controller
const logout = (req, res) => {
  res.clearCookie("token", { path: "/" });
  req.session.destroy(() => {
    res.redirect("/login");
  });
};



module.exports = {
  login,
  checkUser,
  logout,
  loadloginform,

};