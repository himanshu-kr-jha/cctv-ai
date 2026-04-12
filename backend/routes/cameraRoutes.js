const router = require('express').Router();
const ctrl = require('../controllers/cameraController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', ctrl.listCameras);
router.get('/:id', ctrl.getCamera);
router.post('/', ctrl.createCamera);
router.put('/:id', ctrl.updateCamera);
router.patch('/:id/model', ctrl.assignModel);
router.post('/:id/start', ctrl.startDetection);
router.post('/:id/stop', ctrl.stopDetection);
router.get('/:id/stream', ctrl.streamVideo);
router.delete('/:id', ctrl.deleteCamera);

module.exports = router;
