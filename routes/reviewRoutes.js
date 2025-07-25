const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrict('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.restrict('user', 'admin'),
    reviewController.deleteReview
  )
  .get(reviewController.getReview)
  .patch(
    authController.restrict('user', 'admin'),
    reviewController.updateReview
  );

module.exports = router;
