const router = require('express').Router();
const ctrl = require('../controllers/modelController');
const { protect } = require('../middlewares/auth');
const { uploadModel } = require('../middlewares/upload');

router.use(protect);

router.get('/', ctrl.listModels);
router.get('/:id', ctrl.getModel);
router.post('/', uploadModel.single('modelFile'), ctrl.createModel);
router.put('/:id', ctrl.updateModel);
router.patch('/:id/toggle', ctrl.toggleModel);
router.delete('/:id', ctrl.deleteModel);

module.exports = router;
