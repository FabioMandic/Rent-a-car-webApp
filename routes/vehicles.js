
const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  deleteVehicle,
  addVehicle,
  upload,
  toggleFavorite,
  getFavoritesByUser
} = require('../controllers/vehiclesController');
const { adminOnly } = require('../middlewares/authMiddleware');

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);


router.delete('/:id', adminOnly, deleteVehicle);
router.post('/', adminOnly, upload.single('image'), addVehicle);


router.post('/favorite', toggleFavorite);
router.get('/favorites/:userId', getFavoritesByUser);

module.exports = router;







