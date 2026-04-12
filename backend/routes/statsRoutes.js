const router = require('express').Router();
const ctrl = require('../controllers/statsController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/dashboard', ctrl.dashboardStats);
router.get('/analytics', ctrl.analytics);

module.exports = router;
