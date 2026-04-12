const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/stats', ctrl.alertStats);
router.get('/export/csv', ctrl.exportCSV);
router.get('/', ctrl.listAlerts);
router.get('/:id', ctrl.getAlert);
router.patch('/:id/read', ctrl.markRead);
router.delete('/', ctrl.clearAlerts);

module.exports = router;
