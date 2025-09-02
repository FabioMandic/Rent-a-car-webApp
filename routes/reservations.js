const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { adminOnly } = require('../middlewares/authMiddleware');


router.post('/', reservationController.createReservation);


router.get('/', adminOnly, reservationController.getAllReservations);


router.get('/user/:userId', reservationController.getUserReservations);


router.put('/:id', adminOnly, reservationController.updateReservationStatus);


router.delete('/:id', reservationController.deleteReservation);

module.exports = router;










