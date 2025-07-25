const Review = require('../models/Review');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// const getReviews = catchAsync(async (req, res, next) => {
//   const reviews = await Review.find({ tour: req.params.tourId })
//     .populate({
//       path: 'tour',
//       select: 'name',
//     })
//     .populate({
//       path: 'user',
//       select: 'name',
//     });

//   res.status(200).json({
//     status: 'Good',
//     data: reviews,
//   });
// });

const getAllReviews = factory.getAll(Review, 'user');

const getReview = factory.getOne(Review, [
  {
    path: 'tour',
  },
  {
    path: 'user',
  },
]);

const setTourUserId = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
};

const createReview = factory.createOne(Review);

const deleteReview = factory.deleteOne(Review);

const updateReview = factory.updateOne(Review);

module.exports = {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserId,
  getReview,
};
