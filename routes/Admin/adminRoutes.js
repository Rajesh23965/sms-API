const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/userController/adminController");
const {authMiddleware} = require("../../middleware/authMiddleware");

// Admin routes
router.get("/admin-form",authMiddleware, adminController.loadAdminForm);
router.get("/admin-form/:id",authMiddleware, adminController.loadAdminForm);
router.post("/save-admin",authMiddleware, adminController.saveAdmin);
router.get("/admin-list",authMiddleware, adminController.listAdmins);
router.get("/delete/:id",authMiddleware, adminController.deleteAdmin);

module.exports = router;