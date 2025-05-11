const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/RenewStudentController/renewStudent');

router.get('/', promotionController.displayPromotionPage);

router.get('/history/:studentId', promotionController.getPromotionHistory);
router.get('/sections/:class_id', promotionController.getClassSections);
router.post('/auto', promotionController.promoteStudents);
router.get('/manual/:studentId', promotionController.getManualPromotionForm);
router.post('/manual/:studentId', promotionController.processManualPromotion);
module.exports = router;








