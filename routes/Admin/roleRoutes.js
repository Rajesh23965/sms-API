const express = require("express");
const router = express.Router();
const roleController = require("../../controllers/RoleController/roleController");

router.get("/", roleController.loadRoleUI);
router.post("/", roleController.createOrUpdateRole);
router.get("/delete/:id", roleController.deleteRole);

module.exports = router;