const express=require("express");
const router=express.Router();
const homeLayoutController=require("../../controllers/HomeLayoutController/homeLayoutController");
const {authMiddleware} = require("../../middleware/authMiddleware");

// Home Layout Routes
router.get('/form',authMiddleware, homeLayoutController.loadAddHomeLayout);
router.get('/add',authMiddleware, homeLayoutController.loadAddHomeLayout);
router.get('/edit/:id',authMiddleware, homeLayoutController.loadEditHomeLayout);
router.post('/save',authMiddleware, homeLayoutController.createAndUpdateHomeLayout);
router.get('/delete/:id',authMiddleware, homeLayoutController.deleteHomeLayout);
router.get('/apis', homeLayoutController.getHomeLayouts);

module.exports = router;